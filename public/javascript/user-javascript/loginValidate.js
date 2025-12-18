
const passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$&]).{8,20}$/;
const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

var rPassword = document.getElementById("user-password");
var rEmail = document.getElementById("user-email");

let isEmailValid = false;
let isPassValid = false;

document.addEventListener("DOMContentLoaded",function () {
  var serverMessage = document.getElementById("serverMessage")?.value

  if(serverMessage === "User does not Exist - Please Create Account"){
    
    iziToast.error({
      title : "Error",
      message: serverMessage,
     position: 'topRight'
    })
     
  }
  if(serverMessage === "User Logged Out"){
    iziToast.success({
        title : "Success",
        message: serverMessage,
       position: 'topRight'
      })
      
  }
  if(serverMessage === "Incorrect Password"){
    iziToast.error({
      title : "Error",
      message: serverMessage,
     position: 'topRight'
    })
    
  }
  if(serverMessage === "User Already Exists, Please Log In"){
    iziToast.info({
      title : "Info",
      message: serverMessage,
     position: 'topRight'
    })
    
  }
  if(serverMessage === "User Created Successfully, Please Log In"){
    iziToast.success({
      title : "Success",
      message: serverMessage,
     position: 'topRight'
    })
   
  }
  if(serverMessage === "You have been Blocked by the Admin, Contact the Administration"){
    iziToast.error({
      title : "Error",
      message: serverMessage,
     position: 'topRight'
    })
    
  }

  if(serverMessage === "Password Updated Succesfully"){
    iziToast.success({
      title : "Success",
      message: serverMessage,
     position: 'topRight'
    })
   
  }

})



rEmail.addEventListener("input", () => {
  if (!emailReg.test(rEmail.value)) {
    isEmailValid = false
  } else {
    isEmailValid = true
  }
});

rPassword.addEventListener("input", () => {
  if (!passwordReg.test(rPassword.value)) {
    isPassValid = false
  } else {
    isPassValid = true
  }
});



function validate() {
    
    isEmailValid = emailReg.test(rEmail.value);
  isPassValid = passwordReg.test(rPassword.value);
  if (
    isEmailValid !== true 
       
  ){
    iziToast.error({
      title : "Error",
       message: "Please fill all the required Fields",
      position: 'topRight'
    })
    return false; 
  }else if(isPassValid !== true ){
    iziToast.error({
        title : "Error",
         message: "Please fill all the required Fields",
        position: 'topRight'
      })
      return false
  }
  return true;
}



function toggleVisibility(){
  var inputPassword = document.getElementById("user-password")
  const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7"/></g></svg>`
  const eyeClose = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.875 18.825A10 10 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7A10 10 0 0 1 4.02 8.971m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.95 9.95 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.03 10.03 0 0 1-4.132 5.411m0 0L21 21"/></svg>`
  if(inputPassword.type === "password"){
    inputPassword.type = "text"
    document.getElementById("toggleEye").innerHTML = eyeOpen
  }else{
    inputPassword.type = "password"
    document.getElementById("toggleEye").innerHTML = eyeClose
  }
}