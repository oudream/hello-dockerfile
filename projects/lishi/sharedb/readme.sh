#!/usr/bin/env bash


### step 1: install node
sudo apt update
sudo apt install nodejs
# or 或者
NODE_VERSION=v12.16.0
NODE_DISTRO=linux-x64
wget https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz
sudo mkdir -p /usr/local/lib/nodejs
sudo tar -xJvf node-${NODE_VERSION}-${NODE_DISTRO}.tar.xz -C /usr/local/lib/nodejs

sed -i "$ a export PATH=/usr/local/lib/nodejs/node-${NODE_VERSION}-${NODE_DISTRO}/bin:"'$PATH' ~/.profile


### step 2: install mysql-server
sudo apt update
sudo apt install mysql-server
# root password
# https://stackoverflow.com/questions/11223235/mysql-root-access-from-all-hosts
mysql -u root -p
# mysql>
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password';


### step 3:
git clone https://github.com/oudream/hello-docker.git --recursive
cd /opt/limi/hello-docker/assets/lishi/sharedb
# note note note
npm i sqlite3 node-sass --unsafe-perm
npm i


### step 4 : modify password file
### mysql password.sh
GCL3_MYSQL_PASSWORD=123456

#
cd /opt/limi/hello-docker
git pull origin master
sed -i "s/123456/${GCL3_MYSQL_PASSWORD}/g" ./projects/lishi/sharedb/master.json

# create table
mkdir -p ./projects/lishi/sharedb/static/images
node ./projects/lishi/sharedb/main-db-init.js

# build
node ./projects/lishi/sharedb/main-build.js

# server
node ./projects/lishi/sharedb/main-server.js

# debug
node ./projects/lishi/sharedb/main-debug.js
# cp
#    rm -r ./projects/lishi/sharedb/vue-admin
#    mkdir ./projects/lishi/sharedb/vue-admin
#    cp ./projects/lishi/sharedb/dist/index.html ./projects/lishi/sharedb/index.html
#    cp -r ./projects/lishi/sharedb/dist/static ./projects/lishi/sharedb/vue-admin/


# open browser
open http://localhost:2292
# open http://localhost:2292/hello-docker/projects/lishi/sharedb/dist
# upload
cd /opt/limi/hello-docker/hello/nginx/upload1
sFp1=$PWD/readme.md
curl  -F "file=@${sFp1};type=text/plain;filename=a1" 122.51.12.151:2232/upload



# electron
docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine

#
yarn # or npm install
yarn run dev # or npm run dev
npm i -g electron-builder
electron-builder --windows



### QA
# Cross-Origin Request Blocked
# https://github.com/axios/axios/issues/853


# backup
#    mysql
#    # mysql>
#        create database db1;
#        INSERT INTO `user`(`id`, `name`, `password`) VALUES ('1','admin','admin');
#        exit
#
#    INSERT INTO `db1`.`bureau`(`id`, `name`, `phone`, `email`, `addr`, `remark`) VALUES (3, '香洲局', '88843121', NULL, '人民西路XXX 号，香洲局', NULL);
#    INSERT INTO `db1`.`bureau`(`id`, `name`, `phone`, `email`, `addr`, `remark`) VALUES (4, '唐家局', '8884322', 'xxx2@xxx.com', '人民西路XXX号，2', '备注的枯要，备注备注');
#    INSERT INTO `db1`.`bureau`(`id`, `name`, `phone`, `email`, `addr`, `remark`) VALUES (5, '金湾局', '8884323', '3@xxx.com', '人民西路3号', NULL);
#    INSERT INTO `db1`.`bureau`(`id`, `name`, `phone`, `email`, `addr`, `remark`) VALUES (6, '斗门局', '8884324', '4@xxx.com', '人民西路4号', NULL);
#    INSERT INTO `db1`.`bureau`(`id`, `name`, `phone`, `email`, `addr`, `remark`) VALUES (7, '金鼎局', '8884325', '5@xxx.com', '保可可国国是是另国', '村沙发舒服');


### modify db
# UPDATE Vehicle SET BeginDT='-62164540800000' WHERE BeginDT='----';
# UPDATE Vehicle SET EndDT='-62164540800000' WHERE EndDT='----';
#    UPDATE Vehicle SET EndDT='-62164540800000' WHERE EndDT='----';
#
#    UPDATE Vehicle SET BeginDT=0 WHERE BeginDT='-62164540800000';
#
#    UPDATE Vehicle SET EndDT='0' WHERE EndDT='';
#
#    SELECT * FROM Vehicle WHERE EndDT='-'
#
#    SELECT * FROM Vehicle WHERE EndDT=''
#
#    SELECT * FROM Vehicle WHERE IS_NUMERIC(BeginDT)
#
#    SELECT * FROM Vehicle WHERE concat('',EndDT * 1) != EndDT
#
#    UPDATE Vehicle, Man SET Vehicle.ManID = Man.ManID WHERE Vehicle.ManName = Man.ManName

# 1，数据库从 mdb 中导入
# 2，修正数据库的数据，修正数据库的字段类型，把图片单独提取出来
# 3，做服务器的图片上传功能，管理上传后的文件
# 4，做客户端的图片上传功能，做关联的增、删、改
# 5，做客户端的整体框架（外形、登录）
# 6，做客户端的快速搜索功能
# 7，尝试做 Electron 客户端，已经上传到 https://github.com/oudream/lishi-sharedb
# 8，做main-server.js，单独提取服务端功能……
# 9, 部署


