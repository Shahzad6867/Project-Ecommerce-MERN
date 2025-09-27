let otpCreatedTimeString = NaN
 let otpCreatedTime = new Date(otpCreatedTimeString)   
 console.log(otpCreatedTime)  
 let now = new Date()
 let countdown = (otpCreatedTime.getTime() - now.getTime()) / 1000


 console.log(countdown)