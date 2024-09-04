import cv2 as cv
img = cv.imread("./Light Bulbs.jpg")
cv.imshow("bulb",img)
gray = cv.cvtColor(img,cv.COLOR_BGR2GRAY)
cv.imshow('Gray',gray)
blur = cv.GaussianBlur(img,(3,3),cv.BORDER_DEFAULT)
cv.imshow('Blur',blur)
lower_white= 215,215,215
upper_white=255,255,255
mask = cv.inRange(blur,lower_white,upper_white)
result=cv.bitwise_and(img,img,mask=mask)
cv.imshow('Whitespots',result)
cv.waitKey(0)
cv.destroyAllWindows()