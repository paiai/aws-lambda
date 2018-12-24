#!/bin/bash
yum -y update
yum -y install httpd24 php56 mysql55-server php56-mysqlnd
service httpd start
chkconfig httpd on