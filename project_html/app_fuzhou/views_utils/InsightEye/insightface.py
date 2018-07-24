#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Mar 16 15:12:02 2018

@author: long
"""
from app_fuzhou.views_utils.InsightEye import insightfacerec
import cv2
import os
import re
import math
from sklearn import neighbors
import numpy as np
from collections import namedtuple
import time


class insightface(object):
    def __init__(self):
        self.knn = None
        self.data= None
        self.simi=None
        self.encoded_facei = None
    #read image file
    def imread(self,path):
        return insightfacerec.load_image_file(path)
    
    #display an image and dectect the face
    def _display(self,image,locations=None):
        if locations is None:
            cv2.imshow('image', image)
        else:
            for (top, right, bottom, left) in locations:
                cv2.rectangle(image, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.imshow('image', image)
        while True:
            if cv2.waitKey(1) & 0xFF == ord('q'):
                cv2.destroyAllWindows()
                return

    #given a file_path, train the KNN classificer
    def _knn_by_traindata_path(self,train_data_path=None,k=None,knn_algo='ball_tree',verbose=0):
        if train_data_path is None:
            raise Exception("Must supply train_data_path for KNN")

        X = []
        y = []
        
        def image_files_in_folder(folder):
            return [os.path.join(folder, f) for f in os.listdir(folder) if re.match(r'.*\.(jpg|jpeg|png)', f, flags=re.I)]
    
        # Loop through each person in the training set
        for class_dir in os.listdir(train_data_path):
            if not os.path.isdir(os.path.join(train_data_path, class_dir)):
                continue
    
            # Loop through each training image for the current person
            for img_path in image_files_in_folder(os.path.join(train_data_path, class_dir)):
                image = insightfacerec.load_image_file(img_path)
                face_bounding_boxes = insightfacerec.face_locations(image)
    
                if len(face_bounding_boxes) != 1:
                    # If there are no people (or too many people) in a training image, skip the image.
                    if verbose:
                        print("Image {} not suitable for training: {}".format(img_path, "Didn't find a face" if len(face_bounding_boxes) < 1 else "Found more than one face"))
                else:
                    # Add face encoding for current image to the training set
                    X.append(insightfacerec.face_encodings(image, known_face_locations=face_bounding_boxes)[0])
                    y.append(class_dir)

        # Determine how many neighbors to use for weighting in the KNN classifier
        if k is None:
            k = int(round(math.sqrt(len(X))))
            if verbose:
                print("Chose n_neighbors automatically:", k)
    
        # Create and train the KNN classifier
        knn_clf = neighbors.KNeighborsClassifier(n_neighbors=k, algorithm=knn_algo, weights='distance')
        knn_clf.fit(X, y)
        
        return knn_clf
    
    #given all the data of db_faces,train the KNN classifier
    def _knn_by_train_data(self,train_data,k=None,knn_algo='ball_tree',):
        #encode_db_faces/train_data, dict模式，结构如下{'people_name':[encode_p_1,encode_p_2,...],...}
        X=[]
        y=[]
        for i in train_data.keys():
            for j in train_data[i]:
                X.append(j)
                y.append(i)
                
        # Determine how many neighbors to use for weighting in the KNN classifier
        if k is None:
            k = int(round(math.sqrt(len(X))))
    
        # Create and train the KNN classifier
        knn_clf = neighbors.KNeighborsClassifier(n_neighbors=k, algorithm=knn_algo, weights='distance')
        knn_clf.fit(X, y)
        
        return knn_clf
    
    
    def _knn_tolerance(self,db_faces,encoded_face,tolerance):
        if self.data is None:
            self.data = []
            for i in db_faces.keys():
                for j in db_faces[i]:
                    self.data.append(j)
        self.simi = self.comparaface_many(encoded_face,self.data)
        if min(self.simi) > tolerance:
            return True
        else:
            return False
    
    #given a picture,return the locations of faces in the picture
    def detectionface(self,image,num_upsample=1, model='hog',display=False):
        if not isinstance(image,np.ndarray):
            raise TypeError('please enter a np.array,not a path')
        if not model=='hog' and not model=='cnn':
            raise TypeError('the model must be "hog" or "cnn"')

        locations = insightfacerec.face_locations(image,num_upsample, model)
        if display:
            self._display(image,locations)
        return locations
    
    #return the encoded feature of faces, the faces are represented by image and locations
    def encodface(self,image,locations):
        encoded_faces_list = insightfacerec.face_encodings(image,locations)
        return encoded_faces_list
    
    #encodeface a pictrue with a name, alway be used for saving to mysql database
    def encodface_name(self,image,name,model='hog'):
        # if not isinstance(image,str):
        #     raise TypeError('the image should be a file path')
        image = self.imread(image)
        location = self.detectionface(image,model = model)
        encoded_face = self.encodface(image,location)
        person = namedtuple('person','name encoded_face')
        person.name = name
        person.encoded_face = encoded_face
        return person
        
    
    #get the Similarity of two faces. 
    def comparaface(self,encoded_face1,encoded_face2):
        if not isinstance(encoded_face1,list) and not isinstance(encoded_face2,list):
            raise TypeError('all the input should be a list consist of np.ndarray')    
 
        return np.linalg.norm(encoded_face1[0] - encoded_face2[0], axis=0)
    
    #get the Similarity of 1 vs many
    def comparaface_many(self,encoded_face1,encoded_faces):
        if not isinstance(encoded_face1,list) and not isinstance(encoded_faces,list):
            raise TypeError('all the input should be a list consist of np.ndarray')  
        if len(encoded_faces) == 0:
            return np.empty((0))
        simi_list=[np.linalg.norm(encoded_face1[0] - face, axis=0) for face in encoded_faces]
        return simi_list
        
    
    
    #use knn or shortest distance to find the person_name of faces
    #the knn may be trained in the search process
    def searchface(self,encoded_faces,encoded_db_face,tolerance=0.43,knn=False,k=None):
        if isinstance(knn,bool) and isinstance(k,int):
            pass
        else:
            raise TypeError('"knn"should be bool and "k" should be int digit')
        person_name = []
        if knn is False:
            start = time.time()
            for encoded_face in encoded_faces:
                #the encoded_face organized by list
                encoded_face=[encoded_face]
                shortest_distance = tolerance
                name_this_person = 'Unknow'
                for person in encoded_db_face.keys():
                    distance = self.comparaface_many(encoded_face,encoded_db_face[person])
                    distance = min(distance)
                    if distance < tolerance and distance < shortest_distance:
                        name_this_person = person
                        shortest_distance = distance
                person_name.append(name_this_person)
            end = time.time() - start
            # print('recognize each frame need time:%0.5fs'%end )
            return person_name
        else:
            #start = time.time()
            if self.knn is None:
                # 如果 encoded_db_face是空字典就会报错
                try:
                    knn_clf = self._knn_by_train_data(train_data=encoded_db_face,k=k)
                    self.knn = knn_clf
                except Exception as e:
                    return person_name

            else:
                knn_clf = self.knn
                
            if len(encoded_faces) > 0:
                person_name = list(knn_clf.predict(encoded_faces))
                #end1 = time.time()-start
                for i in range(len(encoded_faces)):
                    encoded_face = [encoded_faces[i]]
                    if self._knn_tolerance(encoded_db_face,encoded_face,tolerance=tolerance):
                        person_name[i] = 'Unknow'
                        self.encoded_facei = encoded_face
                #end2 = time.time() - start
                #print('preidict time1:%0.5f, predict time2:%0.5f'%(end1,end2))
                return person_name
            else:
                return person_name
    
'''
import insightface
inface = insightface.insightface()
'''    
            
        
        

