var async = require('async');
var AWS = require('aws-sdk');   // Lambda 실행 환경에 기본 설치되어 있음.
var gm = require('gm').subClass({imageMagick: true});   // gm모듈 : ImageMagick의 래퍼 역할, Lambda 실행 환경에 기본 설치되어 있음.
var util = require('util')

var DEFAULT_MAX_WIDTH = 200;
var DEFAULT_MAX_HEIGHT = 200;
var DDB_TABLE = 'images';   // Dynamo DB 테이블

var s3 = new AWS.S3();
var dynamodb = new AWS.DynamoDB();

function getImageType(key, callback) {
    var typeMatch = key.match(/\.([^.]*)$/); // .(.을 제외한 문자열??)
    if ( !typeMatch ) {
        callback("Could not determine the image type for key: ${key}");
        return;
    }
    
    var imageType = typeMatch[1];
    if ( imageType != 'jpg' && imageType != 'png' ) {
        callback('Unsupported image type: ${imageType}');
        return;
    }
    return imageType;
}

exports.handler = (event, context, callback) => {
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;
    var dstBucket = srcBucket;
    var dstKey = "thumbs/" + srcKey;
    var imageType = getImageType(srcKey, callback);

    async.waterfall([
        function downloadImage(next) {  // 소스 이미지를 S3에서 버퍼로 다운로드
            s3.getObject({  
                Bucket: srcBucket,
                Key: srcKey
            }, next);
        },
        function transformImage(response, next) {
            gm(response.Body).size(function(err, size){
                var metadata = response.Metadata;
                console.log("Metacdata:\n", util.inspect(metadata, {depth: 5}));
                var max_width;
                if ( 'width' in metadata ) {    // S3 객체 메타데이터에서 섬네일 사이즈 가져오기
                    max_width = metadata.width;
                } else {
                    max_width = DEFAULT_MAX_WIDTH;
                }

                var max_height;
                if ( 'height' in metadata ) {    // S3 객체 메타데이터에서 섬네일 사이즈 가져오기
                    max_height = metadata.height;
                } else {
                    max_height = DEFAULT_MAX_HEIGHT;
                }

                var scalingFactor = Math.min(
                    max_width / size.width,
                    max_height / size.height
                );
                var width = scalingFactor * size.width;
                var height = scalingFactor * size.height;

                this.resize(width, height)  // 섬네일 사이즈 재조정
                    .toBuffer(imageType, function(err, buffer) {
                        if ( err ) {
                            next(err);
                        } else {
                            next(null, response.ContentType, metadata, buffer);
                        }
                    });
            });
        },
        function uploadThumbnail(contentType, metadata, data, next) {   // 썸네일을 S3에 업로드
            s3.putObject({  // 자바스크립트 SDK를 이용한 객체 업로드
                Bucket: dstBucket,
                Key: dstKey,
                Body: data,
                ContentType: contentType,
                Metadata: metadata
            }, function(err, buffer) {
                if ( err ) {
                    next(err);
                } else {
                    next(null, metadata);
                }
            });
        },
        function storeMetadata(metadata, next) {    // DynamoDB에 메타데이터 저장
            var params = {  // DynamoDB 호출을 위한 매개변수
                TableName: DDB_TABLE,
                Item: {
                    name: { S: srcKey },
                    thumbnail: { S: dstKey },
                    timestamp: { S: (new Date().toJSON()).toString() },
                }
            };
            if ( 'author' in metadata ) {
                params.Item.author = { S: metadata.author };
            }
            if ( 'title' in metadata ) {
                params.Item.title = { S: metadata.title };
            }
            if ( 'description' in metadata ) {
                params.Item.description = { S: metadata.description };
            }
            dynamodb.putItem(params, next); // DynamoDB 테이블에 아이템 작성
        }
    ], function(err) {
        if ( err ) {
            console.error(err);
        } else {
            console.log('Successfully resized ' + srcBucket + '/' + srcKey + ' and uploaded to ' + dstBucket + '/' + dstKey);
        }
        callback(); // 함수를 정상적으로 종료
    });
};
