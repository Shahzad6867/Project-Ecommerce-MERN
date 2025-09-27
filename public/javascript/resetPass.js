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