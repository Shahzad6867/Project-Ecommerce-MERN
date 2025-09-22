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
