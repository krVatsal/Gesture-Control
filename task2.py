import numpy as np
import cv2 as cv

image = cv.imread("./task2.jpeg")
cv.imshow("Original Image", image)
blur = cv.GaussianBlur(image, (3, 3), cv.BORDER_DEFAULT)
lower_white = np.array([220, 220, 220])
upper_white = np.array([255, 255, 255])
mask = cv.inRange(blur, lower_white, upper_white)
result = cv.bitwise_and(image, image, mask=mask)

cv.imshow("Detected White Color", result)
cv.waitKey(0)
cv.destroyAllWindows()
