feather.replace()
const passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$&]).{8,20}$/;

const password = document.getElementById("password")
const cPassword = document.getElementById("confirmPassword")

password.addEventListener("input", () => {
    if (!passwordReg.test(password.value)) {
      password.style.border = "2px solid red";
      document.getElementById("password-p").style.color = "red";
    } else {
      password.style.border = "2px solid green";
      document.getElementById("password-p").style.color = "";
    }
  });
  
  cPassword.addEventListener("input", () => {
    if (cPassword.value !== password.value) {
      cPassword.style.border = "2px solid red";
      document.getElementById("confirmPassword-p").style.color = "red";
    } else {
      cPassword.style.border = "2px solid green";
      document.getElementById("confirmPassword-p").style.color = "";
    }
  });

  function validate(){
    if((password.value === "" || password.value === undefined || password.value === null) &&  password.style.border !== "2px solid green"){
        iziToast.error({
            title: "Error",
            message: "Enter a Password",
            position: "topRight",
          });
          return false;
    }
    if (
        password.style.border !== "2px solid green" ||
        cPassword.style.border !== "2px solid green"
      ) {
        iziToast.error({
          title: "Error",
          message: "Passwords do no Match!",
          position: "topRight",
        });
        return false;
      }
      return true;
  }

  function toggleVisibility1(){
    var inputPassword = document.getElementById("password")
    const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7"/></g></svg>`
    const eyeClose = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.875 18.825A10 10 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7A10 10 0 0 1 4.02 8.971m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.95 9.95 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.03 10.03 0 0 1-4.132 5.411m0 0L21 21"/></svg>`
    if(inputPassword.type === "password"){
      inputPassword.type = "text"
      document.getElementById("toggleEye1").innerHTML = eyeOpen
    }else{
      inputPassword.type = "password"
      document.getElementById("toggleEye1").innerHTML = eyeClose
    }
  }
  function toggleVisibility2(){
    
    var inputConfirmPassword = document.getElementById("confirmPassword")
    const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7"/></g></svg>`
    const eyeClose = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.875 18.825A10 10 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7A10 10 0 0 1 4.02 8.971m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.95 9.95 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.03 10.03 0 0 1-4.132 5.411m0 0L21 21"/></svg>`
    if(inputConfirmPassword.type === "password"){
      inputConfirmPassword.type = "text"
      document.getElementById("toggleEye2").innerHTML = eyeOpen
    }else{
      inputConfirmPassword.type = "password"
      document.getElementById("toggleEye2").innerHTML = eyeClose
    }
  
  }