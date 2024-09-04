import cv2 as cv
import numpy as np

img = cv.imread("Gesture-Control/task_2.jpeg")
cv.imshow('image',img)

gray_scale = cv.cvtColor(img,cv.COLOR_BGR2GRAY)

gaussian = cv.GaussianBlur(gray_scale,(5,5),0,cv.BORDER_DEFAULT)

lower_white = 235
upper_white = 255

mask = cv.inRange(gaussian,lower_white,upper_white)

result = cv.bitwise_and(img,img, mask=mask)

cv.imshow('whitespot_detected',result)

cv.waitKey(0)
cv.destroyAllWindows()