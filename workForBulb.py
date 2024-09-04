import numpy as np
import cv2 as cv

img = cv.imread("bulb.jpeg")

if img is None:
    print("Error: Image not found or unable to load.")
else:
    blur = cv.GaussianBlur(img, (3, 3), cv.BORDER_DEFAULT)
    
    lower_white = np.array([215, 215, 215], dtype=np.uint8)
    upper_white = np.array([255, 255, 255], dtype=np.uint8)
    
    mask = cv.inRange(blur, lower_white, upper_white)
    result = cv.bitwise_and(img, img, mask=mask)
    
    img_resized = cv.resize(img, (result.shape[1], result.shape[0]))
    horizontal1 = np.hstack((img_resized, result))
    
    result_resized = cv.resize(result, (img.shape[1], img.shape[0]))
    horizontal2 = np.hstack((img, result_resized))

    final_img=np.vstack((horizontal1,horizontal2))
    
    # cv.imshow("Merged Horizontal", merged_horizontal)
    # cv.imshow("Merged Vertical", merged_vertical)
    cv.imshow("Final Image",final_img)
    cv.waitKey(0)
    cv.destroyAllWindows()

