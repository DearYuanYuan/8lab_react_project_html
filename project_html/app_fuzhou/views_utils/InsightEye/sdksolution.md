## name:InsightEye
## author:guoguisheng
## date:2018-03-15
## email:guoguisheng@8lab.cn
---------
## 概述
一个SDK开发库，支持通过USB摄像头和RSTP服务获取的图像数据进行人脸识别和活体检测

## 架构
### insightconfig
```
#实现功能配置

[video]
type:usb|rstp
size:640,480
#仅在rstp模式下使用
addr:rstp://xxxxxxxxxxx

[mysql]
host:192.168.1.210
port:3306
user:8lab
password:8lab
db:insightdb

```
### insightvideo
```
基于insightconfig进行insightvideostream类的构造，主要实现对多输入渠道的统一配置处理
1. self.getvideostream(conf) 针对配置信息，返回一个insightvideostream实例
```
### insightvideostream
```
1. self.getframe() 返回当前视频流的画面数据，以矩阵形式展现
2. self.getinfo() 返回当前视频流的一些相关信息
```
### insightface
```
基于视频输入进行人脸识别相关操作
1. self.detectionface(pic) 根据输入图片，寻找人脸
2. self.encodface(faces) 根据输入人脸图片（list形式），返回相关人脸的表征向量
3. self.compareface(encode_face1,encode_face2) 比较两张人脸的相似度
4. self.searchface(encode_faces,encode_db_faces) 根据输入的表征人脸从存档的人脸中搜索对应的人名，
   encode_faces list模式，支持多个表征向量同时搜索
   encode_db_faces, dict模式，结构如下{'people_name':[encode_p_1,encode_p_2,...],...}
   返回list,内容分别为对应人脸的名字

```
### insightdb
```
人脸表征数据存储相关
数据库名可以任意制定，表数据使用如下语句进行数据表创建：
CREATE TABLE `insightdb`.`dbfaces` (
`name` VARCHAR(45) NULL,
`faces` MEDIUMTEXT NULL,
PRIMARY KEY (`name`));

1. addtarget(insightface,pics,name) 基于face实例和图片，学习图片中的人脸（list模式）,命名后存档到数据库
2. deltarget(name) 删除指定人名的数据
3. gettarget(name) 返回制定人名数据
4. getdbfaces() 返回远程的所有用户数据，数据结构为encode_db_faces,用于insighface类的searchface
```
### insightdemo
```python
#SDK演示类
#1. 新增人脸到数据库
#2. 基于存档人脸的实时视频流下的人脸识别和标记

encode_db_faces=insightdb.getdbfaces()
s=time.time()
n=0
while True:
 frame=insightvideostream.getframe()
 gray = cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
 cv2.imshow('frame',frame) #一个窗口用以显示原视频
 #cv2.imshow('gray',gray) #另一窗口显示处理视频
 faces=insightface.detectionface(gray)
 encode_faces=self.encodface(faces)
 names=self.searchface(encode_faces,encode_db_faces)
 #基于faces位置和获取到的names进行实时标记
 if cv2.waitKey(1) &0xFF == ord('q'):
     break
 r=time.time()-s
 if r>1:
     print "fps %f" %(n/r) #print the fps number
     n=0
     s=time.time()
```
