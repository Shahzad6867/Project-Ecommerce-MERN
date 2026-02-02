feather.replace();
        const input = document.querySelector("#phoneNumber");
    let iti = window.intlTelInput(input, {
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js", // for formatting and validation
      initialCountry: "auto", // or a specific country code like "us"
      geoIpLookup: function(callback) { // optional: lookup user's country based on IP
        fetch("https://ipapi.co/json")
          .then(res => res.json())
          .then(data => {
            countryCode = data.country_calling_code
          return callback(data.country_code)
          })
          .catch(() => callback("us")); // default to US on error
      },
    });
        const serverMessage = document.getElementById("serverMessage").value 

        if(serverMessage === "Oops! Something went wrong"){
            iziToast.error({
                title : "Error",
                message : serverMessage,
                position : "topRight"
            })
        }
        
        // Image preview for avatar upload
        document.getElementById('imageUpload').addEventListener('change', function(e) {
            
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('imagePreview').src = event.target.result;
                };
                reader.readAsDataURL(file);
                document.getElementById("cropBtn").hidden = false
            }
        });
        
        let cropper = null
        let file = null
        let imageUpload = document.getElementById("imageUpload")
        function cropImage() {
            let cropModal = document.getElementById("cropModal")
            let displayImg = document.getElementById('cropImage')
            cropModal.style.display = "block"
             file = imageUpload.files[0]
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    displayImg.src = event.target.result
                    if(cropper){
                        cropper.destroy()
                        cropper = null
                    }
                    cropper = new Cropper(displayImg,{ 
                        aspectRatio : 1,
                        viewMode : 1,
                        guides : true,
                        background : true,
                        autoCropArea : 1,
                        zoomable : true
                    })
                };
                reader.readAsDataURL(imageUpload.files[0]);
                
            }
        };
        let closeCropBtn = document.getElementById('closeCropBtn')
        let cancelCropBtn = document.getElementById('cancelCropBtn')

        
       function closeModal(){
         document.getElementById("cropModal").style.display = "none"
        if(cropper !== null){
            cropper.destroy()
            cropper = null
        }
       }
       function cropAndSaveImage(){
            if(cropper !== null){
                let croppedCanvas = cropper.getCroppedCanvas()
                    if(croppedCanvas){
                        croppedCanvas.toBlob((blob) => {
                            let fileName = file.name + Date.now()
                                let croppedFile = new File([blob],fileName,{type : "image/jpeg"})
                                const daraTransfer = new DataTransfer()

                                daraTransfer.items.add(croppedFile)
                               
                                imageUpload.files = daraTransfer.files
                            
                        },"image/jpeg",1)
                    }
    
            document.getElementById("imagePreview").src = croppedCanvas.toDataURL("image/jpeg")
            closeModal()
            }
            
        }
        const firstName = document.getElementById("firstName").value.trim();
const lastName = document.getElementById("lastName").value.trim();

document.getElementById("edit-profile-form").addEventListener("submit", function(e) {

    const newFirstName = document.getElementById("firstName").value.trim();
    const newLastName = document.getElementById("lastName").value.trim();
    const imageUpload = document.getElementById("imageUpload")

    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*(?:\d{0,5})?$/
    console.log()
    const newIntlNumber = iti.getNumber();

    // ❗ detect no change correctly
    if (imageUpload.files.length === 0 &&
        newFirstName === firstName &&
        newLastName === lastName &&
        newIntlNumber === ""
    ) {
        e.preventDefault();
        iziToast.error({
            title: "Error",
            message: "No changes detected!",
            position: "topRight"
        });
        return;
    }
    
    // ❗ validation check
    if (
        newFirstName === "" || !nameRegex.test(newFirstName) 
    ) {
        e.preventDefault();
        iziToast.error({
            title: "Error",
            message: "Invalid values entered!",
            position: "topRight"
        });
        return;
    }

    if(newLastName === "" || !nameRegex.test(newLastName) ){
        e.preventDefault();
        iziToast.error({
            title: "Error",
            message: "Invalid values entered!",
            position: "topRight"
        });
        return;
    }
   
    if(!iti.isValidNumber(newIntlNumber)){
        e.preventDefault();
        iziToast.error({
            title: "Error",
            message: "Enter a Valid Mobile Number",
            position: "topRight"
        });
        return;
    }

    input.value = newIntlNumber;
});

        