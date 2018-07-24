## name:InsightEye
## autor:guoguisheng
## date:2018-3-23
## version:1.0.0
-------------

##概述
一个SDK开发库，支持通过USB摄像头获取的图像数据进行人脸识别

##环境依赖
```
1. linux
2. python 3.5
3. python第三方库：pymysql，numpy,cv2,sklearn,dlib

sudo pip3 install numpy
sudo pip3 install opencv-python
sudo pip3 install scikit-learn

sudo apt-get install build-essential cmake
sudo apt-get install libgtk-3-dev
sudo apt-get install libboost-all-dev
sudo pip3 install dlib
```
##架构
```
1. insightconfig           用于读取配置文件
2. insightvideo            基于insightconfig进行insightvideostream类的构造，主要实现对多输入渠道的统一配置处理
3. insightvideostream      返回当前视频画面以及相关信息
4. insightface             用于对图像进行人脸检测，识别等相关操作
5. insightdb               根据配置信息，对人脸表征数据库进行相关操作。所有的数据存储于一个’dbfaces'的表中
6. inisightconfig.ini      配置文件
```
##数据库相关
```
人脸表征数据存储相关
数据库名可以任意制定，表数据使用如下语句进行数据表创建：
CREATE TABLE `insightdb`.`dbfaces` (
`name` VARCHAR(45) NULL,
`faces` MEDIUMTEXT NULL,
PRIMARY KEY (`name`));
```

## insightconfig类
```
1. insightcongit(config_file）   给定配置文件路径，生成insightconfig实例
2. self.conf_dict                保存着实例的配置文件信息，数据形式为python嵌套字典
```
## insightvideo类
```
1. insightvideo(conf_dict)       根据insightconfig解析的配置信息，返回insightvideo实例
2. self.getvideostream(**kwargs) 根据用户所需的配置信息，返回一个getvideostream实例
```


##insightvideostream类
```
1. insightvideostream(conf_dict)    根据输入的以字典形式表示的配置信息生成insightvideostream实例
2. self.get_frame()                 返回当前视频流的画面数据，以矩阵形式展现
3. self.get_video()                 返回当前视频留的视频数据，以视频窗口展现
4. self.get_info()                  返回当前视频流的一些相关信息，如帧率，视频分辨率和当前用户设定的配置信息等
5. self.conf_dict                   仅保存用户当前设定的配置信息
```
##insightface类
```
1. self.knn     保存数据库数据训练出knn模型
2. self.data    保存数据库中所有的人脸表征数据，以list[encodedface_1,...encodedface_n]表示
3. self.imread  根据输入路径，返回图像对象，以矩阵形式表示
4. self.detectionface(image,num_upsample=1, model='hog',display=False)     根据输入图像对象，返回人像中人脸所在的位置，返回形式为[location_1,location_2,...,location_n]，图像中无人脸则返回空list
5. self.encodface(image,locations)        根据输入图像对象与self.detectionface()返回人脸坐标。返回对人脸编码后的表征数据
6. self.encodface_name(image,name,model='hog')    根据输入图像路径，人名。返回命名元组person。person.name保存人名。person.encoded_face保存人脸表征数据。
7. comparaface(encoded_face1,encoded_face2)       根据输入的两个人脸的表征数据，返回他们的相似度，返回值越小，人脸越相似。返回为一个浮点数。
8. comparaface_many(encoded_face1,encoded_faces)  根据输入的单个人脸数据，以及多个人脸表征数据组成的list。返回一个list,list中保存这该单个人脸表征数据与其它数据的相似度。
9. searchface(encoded_faces,encoded_db_face,tolerance=0.43,knn=False,k=None) 
    输入描述：encoded_faces为单个或多个人脸表征数据的list；encoded_db_face为数据库所有人名与人脸数据组成的字典。结构为:
    {person_1:[encodedface_1,...,encodedface_n],
    ...,
    person_n:[encodedface_1,...,encodedface_n]};
    tolerance为容忍度，容忍度越高则拒绝集外人脸的能力越差，容忍度过低则可能拒绝集内人脸;knn=Fasle则不使用knn作为识别模型；k为knn的最近邻参数。
    输出描述：以list形返回图像中人脸的人名，无人脸则返回空list。
```

##insightdb类
```
1. insightdb(mysql_dict)              根据输入的与mysql相关的配置信息，返回insightdb实例
2. self.host;self.port;self.user;self.passwd;self.db     insightdb实例的配置信息
3. self.addtarget(encode_faces,name)  把编码后的人脸表征数据（list模式）,命名后存档到数据库，name的长度为1
2. self.deltarget(name)               删除指定人名的人脸表征数据（list模式）
3. self.gettarget(name)               返回指定人名人脸表征数据（list模式）
4. self.getdbfaces()                  返回远程的所有用户数据，数据结构为encode_db_face,用于insighface类
```

##insightconfig.ini 配置文件
```
1. [section] video                    保存rstp模式信息
2. [section] mysql                    保存mysql连接信息
3. [section] knn_n                    根据序号n保存不同的knn配置信息
4. [section] tolerance_n              根据序号n保存不同的容忍度配置信息
```

##环境配置与GPU测试
####（1）系统环境
```
1. 操作系统    ubuntu 16.04
2. 开发环境    Python 3.6.0 |Anaconda custom (64-bit)| (default, Dec 23 2016, 12:22:00) 
3. GPU型号    技嘉GTX 1060 WINDFORCE OC 3G
4. CUDA版本   cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64
5. CUDnn版本  cudnn-8.0-linux-x64-v5.1.tgz
```

####（2）GPU性能检测
```
    scale_ratio      CNN_model      Fps         显存          显卡性能占用
    0.25                True        30          300mb           19%
    0.5                 True        30          300mb           38%
    1                   True        12          415mb           40%
    0.25                False       30          n/a             n/a
    0.5                 False       16          n/a             n/a
    1                   False       5           n/a             n/a
```
####（3）环境安装
######1）CUDA配置
```
Ubuntu初始环境设置
    安装开发包 打开终端输入：
    # 系统升级
    >>> sudo apt update
    >>> sudo apt upgrade
    # 安装python基础开发包
    >>> sudo apt install -y python-dev python-pip python-nose gcc g++ git gfortran vim
    安装运算加速库 打开终端输入：
    >>> sudo apt install -y libopenblas-dev liblapack-dev libatlas-base-dev

CUDA开发环境的搭建(CPU加速跳过)
    打开终端输入：
    >>> sudo dpkg -i cuda-repo-ubuntu1604-8-0-local-ga2_8.0.61-1_amd64.deb
    >>> sudo apt update
    >>> sudo apt -y install cuda
    自动配置成功就好。
    将CUDA路径添加至环境变量 在终端输入：
    >>> sudo gedit /etc/profile
    在profile文件中添加：
    export CUDA_HOME=/usr/local/cuda-8.0
    export PATH=/usr/local/cuda-8.0/bin${PATH:+:${PATH}}
    export LD_LIBRARY_PATH=/usr/local/cuda-8.0/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
    之后source /etc/profile即可
    在终端输入：
    >>> nvcc -V
    会得到相应的nvcc编译器相应的信息，那么CUDA配置成功了。(记得重启系统)
    （要特别注意使用的cuda版本）

加速库cuDNN
    >>> wget https://s3.amazonaws.com/personal-waf/cudnn-8.0-linux-x64-v5.1.tgz
    >>> sudo tar -xzvf cudnn-8.0-linux-x64-v5.1.tgz
    >>> sudo cp cuda/include/cudnn.h /usr/local/cuda/include
    >>> sudo cp cuda/lib64/libcudnn* /usr/local/cuda/lib64
    >>> sudo chmod a+r /usr/local/cuda/include/cudnn.h /usr/local/cuda/lib64/libcudnn*
    在~/.bashrc文件中添加环境变量：
    export LD_LIBRARY_PATH=&quot;$LD_LIBRARY_PATH:/usr/local/cuda/lib64:/usr/local/cuda/extras/CUPTI/lib64&quot;
    export CUDA_HOME=/usr/local/cuda
    保存执行
    >>> source ~/.bashrc

    注意：有一定几率失败
```
######2）dlib，cv2,pymysql配置
```
 1. dlib:
        dlib在win10环境下很难完成最新版本的python安装，最终放弃。
        在ubuntu下，先安装CMAKE等依赖项，再使用pip install dlib安装
 2. cv2
        anaconda环境下，直接使用pip install opencv-python完成
 3. pymysql
        anaconda环境下，使用 conda install pymysql完成安装，conda会自动解决依赖项
```






