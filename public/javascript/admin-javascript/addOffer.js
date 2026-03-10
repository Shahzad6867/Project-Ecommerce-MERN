feather.replace();
         // Form submission
         

        function setAccordingToDiscountType(){
            let offerType = document.getElementById("offerType")
            let discountType = document.getElementById("discountType")
            let discountValue = document.getElementById("discountValue")
            if(offerType.value === "category"){
                document.getElementById("searchInput").placeholder = "Which Category are you looking for ?"
            }else{
                document.getElementById("searchInput").placeholder = "Which Product are you looking for ?"
            }
            if(discountType.value === "percentage"){
                if(offerType.value === "category"){
                    document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = false
                    document.getElementById("maxDiscountAmount").hidden = false
                    discountValue.placeholder = "Discount Percentage must be between 1% and 70%" 
                    return
                }else if(offerType.value === "product"){
                    document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                    discountValue.placeholder = "Discount Percentage must be between 1% and 70%" 
                    return
                }
                    document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                discountValue.placeholder = "Enter a value according to the selected Offer Type"
            }else if(discountType.value === "flat"){
                if(offerType.value === "category"){
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                    document.getElementById("forProductMinPrice").hidden = false
                    document.getElementById("productMinPrice").hidden = false
                    discountValue.placeholder = "Enter a flat discount amount between $10 and $200."
                    return

                }else if(offerType.value === "product"){
                    document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                    discountValue.placeholder = "Enter a flat discount amount that is less than 70% of the Product Price"
                   return
                }
                    document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                    discountValue.placeholder = "Enter a value according to the selected Offer Type"
            }else{
                document.getElementById("forProductMinPrice").hidden = true
                    document.getElementById("productMinPrice").hidden = true
                    document.getElementById("forMaxDiscount").hidden = true
                    document.getElementById("maxDiscountAmount").hidden = true
                discountValue.placeholder = "Enter a value according to the selected Discount Type"
            }
        }
        
        
        
        let categories = [];
        fetch("/admin/search-categories",{method : "GET"})
        .then(res => res.json())
        .then(data => {
            categories = data.categories
        })
        .catch(error => console.log(error))
        
        // Show/hide target selection based on offer type
        document.getElementById('offerType').addEventListener('change', function() {
            const targetSelection = document.getElementById('targetSelection');
            if (this.value === 'product' || this.value === 'category') {
                targetSelection.classList.remove('hidden');
            } else {
                targetSelection.classList.add('hidden');
                clearSelection();
            }
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const offerType = document.getElementById('offerType').value;
            const resultsContainer = document.getElementById('searchResults');
            
            if (searchTerm.length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }
            
            let items = [];
            if (offerType === 'product') {
                fetch(`/admin/search-products?searchTerm=${searchTerm}`,{
                    method : "GET"
                })
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                    items = data.products
                    displayResults(items);
                })
                .catch(error => {
                    console.log(error)
                })
                // items = products.filter(p => p.name.toLowerCase().includes(searchTerm));
            } else if (offerType === 'category') {
                items = categories.filter(c => c.categoryName.toLowerCase().includes(searchTerm));
            }
            
            displayResults(items);
        });
        
        function displayResults(items) {
            const offerType = document.getElementById("offerType")
            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.innerHTML = '';
            
            if (items.length === 0) {
                resultsContainer.innerHTML = '<div class="search-item text-gray-500 rounded-full">No results found</div>';
            } else {
                if(offerType.value === "product"){
                        for(let i = 0 ; i < items.length ; i++){
                        for(let j = 0 ; j < items[i].variants.length ; j++){
                            const div = document.createElement('div');
                            div.className = 'search-item rounded-full';
                            div.textContent = `${items[i].productName}-${items[i].variants[j].color}-${items[i].variants[j].size}`;
                            div.onclick = () => selectItem(items[i],j);
                            resultsContainer.appendChild(div);
                        }
                    }
                }else{
                    for(let i = 0 ; i < items.length ; i++){
                            const div = document.createElement('div');
                            div.className = 'search-item rounded-full';
                            div.textContent = `${items[i].categoryName}`;
                            div.onclick = () => selectItem(items[i]);
                            resultsContainer.appendChild(div);
                    }
                }
                
            }
            
            resultsContainer.style.display = 'block';
        }
        
        function selectItem(item,variant) {
            const offerType = document.getElementById("offerType")
            if(offerType.value === "product"){
                document.getElementById('selectedTarget').value = item._id;
            document.getElementById('selectedTargetVariant').value = variant;
            console.log(item.variants[variant].price)
            document.getElementById('productPrice').value = item.variants[variant].price;
            document.getElementById('selectedName').textContent = `${item.productName}-${item.variants[variant].color}-${item.variants[variant].size}`;
            document.getElementById('selectedDisplay').classList.remove('hidden');
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('searchInput').value = '';
            }else{
                document.getElementById('selectedTarget').value = item._id;
            document.getElementById('selectedName').textContent = item.categoryName;
            document.getElementById('selectedDisplay').classList.remove('hidden');
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('searchInput').value = '';
            }
            
        }
        
        function clearSelection() {
            document.getElementById('selectedTarget').value = '';
            document.getElementById('selectedTargetVariant').value = ''
            document.getElementById('productPrice').value = ''
            document.getElementById('selectedDisplay').classList.add('hidden');
        }
        
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



        function validateOfferForm () {
           // Validate form
           const offerType = document.getElementById('offerType').value;
           const offerName = document.getElementById('offerName').value;
           const startDate = document.getElementById('startDate').value;
           const endDate = document.getElementById('endDate').value;
           const discountType = document.getElementById("discountType").value
           const discountValue = document.getElementById("discountValue").value
           const description = document.getElementById('description').value;
           const selectedTarget = document.getElementById('selectedTarget').value;

           
           
           if(offerName === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Offer Name',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false;
           }
           if(offerType === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Offer Type',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if ((offerType === 'product' || offerType === 'category') && !selectedTarget) {
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a target for the offer',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(description === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please enter a Description',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(startDate === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Valid Start Date and Time',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(endDate === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Valid End Date and Time',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           const now = new Date();
           const start = new Date(startDate);
           const end = new Date(endDate);

           document.getElementById('startDateIso').value = start.toISOString() 
           document.getElementById('endDateIso').value = end.toISOString() 
           console.log(typeof start.toISOString())
           console.log(typeof end.toISOString() )
           if (start <= now) {
            iziToast.error({
                title: 'Invalid Start Date',
                message: 'Start date must be in the future',
                position: 'topCenter'
            });
            event.preventDefault();
            return false
        }

        if (end <= start) {
            iziToast.error({
                title: 'Invalid Date Range',
                message: 'End date must be greater than start date',
                position: 'topCenter'
            });
            event.preventDefault();
            return false
        }
           if(discountType === ""){
               iziToast.error({
                   title: 'Error',
                   message: 'Please select a Discount Type',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(discountValue === ""){
            iziToast.error({
                   title: 'Error',
                   message: 'Please select a Discount Value',
                   position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           let price = document.getElementById("productPrice").value
           if(offerType === "product" && discountType === "flat"){
           
            let discountedPrice = (price * 70) / 100
            
                if(discountValue > discountedPrice){
                            iziToast.error({
                            title: 'Error',
                            message: 'Please enter a Flat Discount Amount that is less than 70% of the Product Price',
                            position: 'topCenter'
                        });
                        event.preventDefault();
                    return false
                }
               
           }else if(offerType === "product" && discountType === "percentage"){
           
            if(discountValue > 70){
    
                iziToast.error({
                title: 'Error',
                message: 'Please enter a Discount Percentage that is less than 70',
                position: 'topCenter'
                });
                event.preventDefault();
                return false
            }

           }else if(offerType === "category" && discountType === "percentage"){
           const maxDiscountAmount = document.getElementById("maxDiscountAmount").value
           if(discountValue > 70){
   
               iziToast.error({
               title: 'Error',
               message: 'Please enter a Discount Percentage that is less than 70',
               position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(!maxDiscountAmount){
            iziToast.error({
               title: 'Error',
               message: 'Please enter a Maximum discount Amount',
               position: 'topCenter'
               });
               event.preventDefault();
               return false
           }

          }else if(offerType === "category" && discountType === "flat"){
           const minProductPrice = document.getElementById("productMinPrice").value
           const maxDiscount = (minProductPrice * 70) / 100
           
           if(discountValue > maxDiscount){
   
               iziToast.error({
               title: 'Error',
               message: 'Please enter a Flat Discount Amount that is less than 70% of the Product Price',
               position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
           if(!minProductPrice){
            iziToast.error({
               title: 'Error',
               message: 'Please enter a Minimum Price for Products that the offer can be applied on.',
               position: 'topCenter'
               });
               event.preventDefault();
               return false
           }
          }
           
           return true
       }

       function updateOffer(){
        if(validateOfferForm()){
            fetch(document.getElementById("offerForm").action , {
                method : "PUT",
                body : new FormData(document.getElementById("offerForm"))
            }).then(res => window.location.href = "/admin/offers")
        }
       }
        