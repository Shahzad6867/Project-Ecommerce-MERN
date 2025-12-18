feather.replace();
        

// document.querySelector('form').addEventListener('submit', function(e) {
//     e.preventDefault();
    
   
// });


 
 
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
  if(serverMessage === "Oops! some error has occured"){
    iziToast.error({
      title: 'Error',
      message: serverMessage,
      position: 'topCenter',
      timeout: 3000
  });
  }
 })

 document.getElementById("resetPassEmailForm").addEventListener("submit",function(e){
  const email = document.getElementById("email")
  const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if(!emailReg.test(email.value)){
    e.preventDefault()
      iziToast.error({
          title: 'Error',
          message: 'Incorrect Email Format',
          position: 'topCenter',
          timeout: 5000,
          transitionIn: 'flipInX',
          transitionOut: 'flipOutX'
      });
      email.style.border = "2px solid red"
      return 
  }
  email.style.border = "2px solid green"
  
})

