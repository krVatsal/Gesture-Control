import cv2 as cv
img = cv.imread("photo/AF4DD575-B40A-472B-8517-2D0723CC072C.jpeg")
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
