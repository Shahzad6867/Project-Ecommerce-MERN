
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
       message: "Incorrect Email Format",
      position: 'topRight'
    })
    return false; 
  }else if(isPassValid !== true ){
    iziToast.error({
        title : "Error",
         message: "Incorrect Password Format",
        position: 'topRight'
      })
      return false
  }
  return true;
}



