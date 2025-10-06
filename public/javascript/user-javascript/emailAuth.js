feather.replace();
        

// document.querySelector('form').addEventListener('submit', function(e) {
//     e.preventDefault();
//     iziToast.success({
//         title: 'Success',
//         message: 'OTP has been sent to your mail! Check your email',
//         position: 'topCenter',
//         timeout: 5000,
//         transitionIn: 'flipInX',
//         transitionOut: 'flipOutX'
//     });
   
// });

const email = document.getElementById("email")
const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

email.addEventListener("input", () => {
    if (!emailReg.test(email.value)) {
      email.style.border = "2px solid red";
     
    } else {
      email.style.border = "2px solid green";
      
    }
  });
 
 
 document.addEventListener("DOMContentLoaded",function (){
    let serverMessage = document.getElementById("serverMessage")?.value
    if(serverMessage === "User does not Exist - Will be redirected to Signup"){
        iziToast.info({
            title: 'Info',
            message: serverMessage,
            position: 'topCenter',
            timeout: 5000,
            transitionIn: 'flipInX',
            transitionOut: 'flipOutX'
        });

       setTimeout(() => {
         window.location.href = "/register"
       },4000)
    }
 })

function validate(){
    if(email.style.border !== "2px solid green"){
        iziToast.error({
            title: 'Error',
            message: 'Incorrect Email Format',
            position: 'topCenter',
            timeout: 5000,
            transitionIn: 'flipInX',
            transitionOut: 'flipOutX'
        });
        return false
    }
    return true
}
