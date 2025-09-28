const passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$&]).{8,20}$/;
const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const nameReg = /^[A-Za-z\s]+$/;

var rFirstName = document.getElementById("reg-first-name");
var rLastName = document.getElementById("reg-last-name");
var rPassword = document.getElementById("reg-password");
var rCpassword = document.getElementById("reg-confirm-password");
var rEmail = document.getElementById("reg-email");
var rTerms = document.getElementById("terms");

rFirstName.addEventListener("input", () => {
  if (rFirstName.value.length < 5 || !nameReg.test(rFirstName.value)) {
    rFirstName.style.border = "2px solid red";
    document.getElementById("reg-name-p").style.color = "red";
  } else {
    rFirstName.style.border = "2px solid green";
    document.getElementById("reg-name-p").style.color = "";
  }
});
rLastName.addEventListener("input", () => {
  if (!nameReg.test(rLastName.value)) {
    rLastName.style.border = "2px solid red";
  } else {
    rLastName.style.border = "2px solid green";
  }
});

rEmail.addEventListener("input", () => {
  if (!emailReg.test(rEmail.value)) {
    rEmail.style.border = "2px solid red";
    document.getElementById("reg-email-p").style.color = "red";
  } else {
    rEmail.style.border = "2px solid green";
    document.getElementById("reg-email-p").style.color = "";
  }
});

rPassword.addEventListener("input", () => {
  if (!passwordReg.test(rPassword.value)) {
    rPassword.style.border = "2px solid red";
    document.getElementById("reg-password-p").style.color = "red";
  } else {
    rPassword.style.border = "2px solid green";
    document.getElementById("reg-password-p").style.color = "";
  }
});

rCpassword.addEventListener("input", () => {
  if (rCpassword.value !== rPassword.value) {
    rCpassword.style.border = "2px solid red";
    document.getElementById("reg-confirmPassword-p").style.color = "red";
  } else {
    rCpassword.style.border = "2px solid green";
    document.getElementById("reg-confirmPassword-p").style.color = "";
  }
});

rTerms.addEventListener("change", () => {
  if (!rTerms.checked) {
    document.getElementById("terms-text").style.color = "red";
  } else {
    document.getElementById("terms-text").style.color = "";
  }
});

function validate() {
  if (
    rFirstName.style.border !== "2px solid green" ||
    rLastName.style.border !== "2px solid green" ||
    rEmail.style.border !== "2px solid green" ||
    rPassword.style.border !== "2px solid green" ||
    rCpassword.style.border !== "2px solid green"
  ) {
    iziToast.error({
      title: "Error",
      message: "Please fill all the Required Fields",
      position: "topRight",
    });
    return false;
  } else if (!rTerms.checked) {
    iziToast.error({
      title: "Error",
      message: "Please Accept the Terms & Conditions!",
      position: "topRight",
    });
    return false;
  }
  return true;
}

function toggleVisibility1(){
  var inputPassword = document.getElementById("reg-password")
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
  
  var inputConfirmPassword = document.getElementById("reg-confirm-password")
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