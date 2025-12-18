feather.replace();
        
        // Auto-focus and move between OTP inputs
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    if (index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '') {
                    if (index > 0) {
                        otpInputs[index - 1].focus();
                    }
                }
            });
        });
        document.addEventListener("DOMContentLoaded",function () {
            let otpCreatedTimeString = document.getElementById("otpTimer")?.value 
            let otpCreatedTime = new Date(otpCreatedTimeString)
            let now = new Date()
            let setTimeoutCount = otpCreatedTime.getTime() - now.getTime()
            let countdown = Math.ceil((otpCreatedTime.getTime() - now.getTime()) / 1000) 
            let resendOtpBtn = document.getElementById("resend-otp-btn")
            resendOtpBtn.classList.add("text-black")
            resendOtpBtn.classList.add("text-opacity-50")
            resendOtpBtn.classList.add("bg-yellow-200")
            
            
            
            
              let timer = setInterval(()=>{
                
                    document.getElementById("timer").innerHTML = countdown--
                    if(countdown <= 0 ){
                        clearInterval(timer)
                        document.getElementById("timer").innerHTML = "Expired"
                        document.getElementById("timer").style.color = "red"
                        document.getElementById("otp-text").innerHTML = "OTP has "
                         document.getElementById("seconds-text").innerHTML = " - Click Below"
                         iziToast.info({
                            title : "Info",
                            message: "OTP has Expired - Click on Resend OTP",
                            position: 'topCenter'
                            })

                         }
                },1000)

                setTimeout(()=>{
                resendOtpBtn.disabled = false
                resendOtpBtn.classList.add("text-black")
                resendOtpBtn.classList.add("text-opacity-100")
                resendOtpBtn.classList.remove("bg-yellow-200")
                resendOtpBtn.classList.add("bg-yellow-400")
                resendOtpBtn.classList.add("hover:bg-yellow-300")
                },setTimeoutCount)  





                var serverMessage = document.getElementById("serverMessage")?.value

                if(serverMessage === 'OTP has been sent to your mail! Check your email'){
                iziToast.success({
                    title : "Success",
                    message: serverMessage,
                    position: 'topCenter'
                    })
                        
                }

                if(serverMessage === "Incorrect OTP"){
        
                iziToast.error({
                title : "Error",
                message: serverMessage,
                position: 'topRight'
                })
                    
                }
                if(serverMessage === "OTP Expired, Click Resend OTP"){
                
                iziToast.error({
                title : "Error",
                message: serverMessage,
                position: 'topRight'
                })
                    
                }
                    
            })
   
