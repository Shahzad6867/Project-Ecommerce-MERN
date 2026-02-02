feather.replace();
         // Form submission
     function previewImage(input) {
        const preview = document.getElementById('previewImg');
        const previewContainer = document.getElementById('imagePreview');

        if (!input.files || !input.files[0]) {
            previewContainer.classList.add('hidden');
            return;
        }

            const file = input.files[0];

        // Optional: file type validation
        if (!file.type.startsWith("image/")) {
            iziToast.error({
                title: 'Invalid File',
                message: 'Please upload a valid image file',
                position: 'topCenter'
            });
            input.value = "";
            previewContainer.classList.add('hidden');
            return;
        }

            const reader = new FileReader();

            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;

                img.onload = function () {
                    const requiredWidth = 1440;
                    const requiredHeight = 384;

                    if (img.width !== requiredWidth && img.height !== requiredHeight) {
                        iziToast.error({
                            title: 'Invalid Image Size',
                            message: `Banner image must be exactly ${requiredWidth} × ${requiredHeight}px`,
                            position: 'topCenter'
                        });

                        input.value = "";
                        preview.src = "";
                        previewContainer.classList.add('hidden');
                        return;
                    }

                    // Valid image
                    preview.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                };
            };

            reader.readAsDataURL(file);
        }



        document.getElementById('couponForm').addEventListener('submit', function(e) {
           // Validate form
          
           const couponName = document.getElementById('couponName').value;
           const endDate = document.getElementById('endDate').value;
           const discountValue = document.getElementById("discountValue").value
           const minAmount = document.getElementById("minAmount").value
           const maxDiscountAmount = document.getElementById("maxDiscountAmount").value
           const description = document.getElementById('description').value;

           const now = new Date();
           const end = new Date(endDate);
           
           if(couponName === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Coupon Name',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           
           if(description === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Description',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           
           if(endDate === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Valid End Date and Time',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           if(end <= now){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Future End Date and Time ',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           if(discountValue === ""){
            iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Discount Value',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           
           
            if(discountValue > 70){
    
                iziToast.error({
                title: 'Error',
                message: 'Please enter a Discount Percentage that is less than 70',
                position: 'topCenter'
                });
                e.preventDefault();
                return;
            }
           if(minAmount === ""){
            iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Minimum Order Amount that the coupon can be Applied',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           if(maxDiscountAmount === ""){
            iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Maximum Discount that the coupon can apply on Order amount.',
                   position: 'topCenter'
               });
               e.preventDefault();
               return;
           }
           

            

      
           
           
           
       });