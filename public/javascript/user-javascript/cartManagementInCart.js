feather.replace();
    

    

    function incrementQuantity(cartId,productId,variantIndex){
        const shipping = 10
        let quantity = document.getElementById(`quantity${cartId}`)
        let price = document.getElementById(`price${cartId}${variantIndex}`).innerText
        let cartItemQtyToBeUpdated = document.getElementById(`cartItemQty${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let myCartHeadInCart = document.getElementById("cartHeadItemCountInCart")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
        let subTotalInCart = document.getElementById("subTotalInCart")
        let subTotalItemsInCart = document.getElementById("subTotalItemsInCart")
        let tax = document.getElementById("tax")
        let grandTotal = document.getElementById("grandTotal")
        console.log(subTotal.innerText)
        let counter = parseInt(quantity.value)
        counter++
        
        if(counter > 10){
            iziToast.warning({
                title: "Quantity Limit Reached",
                message: "You can order up to a maximum of 10 items only.",
                position : "topRight"
            });
        }else{
            
            fetch(`/cart/update-cart-item?productId=${productId}&variant=${variantIndex}&quantity=${counter}`,{method : "PATCH"})
            .then(res => res.json())
            .then(data => {
                if (data.message === "Quantity has been updated in Cart") {
                    subTotal.innerText = Math.round((Number(subTotal.innerText) + ((counter * price) - (Number(quantity.value) * price))) * 100) / 100
                    subTotalInCart.innerText = Math.round((Number(subTotalInCart.innerText) + ((counter * price) - (Number(quantity.value) * price))) * 100) / 100
                    tax.innerText = Math.round((Number(subTotalInCart.innerText) * 0.05) * 100) / 100
                    quantity.value = counter
                    cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) + 1
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) + 1
                    myCartHead.innerText = Number(myCartHead.innerText) + 1
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) + 1
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) + 1
                    grandTotal.innerText = Math.round((Number(subTotalInCart.innerText) + Number(tax.innerText) + shipping) * 100) / 100
                    feather.replace()
                    
                }else if(data.message === "Out of Stock" || data.message === "Product Unavailable"){
                    document.getElementById(`incDecQtyDiv${cartId}`).innerHTML = `
                     <button  type="button" class="text-center w-full rounded-lg px-2 py-2 bg-red-400 font-bold text-black mr-1 " >
                                 ${data.message}
                             </button> `
                    cartItemQtyToBeUpdated.classList.remove("text-black")
                    cartItemQtyToBeUpdated.classList.add("text-red-500")
                    cartItemQtyToBeUpdated.innerText = data.message
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - Number(quantity.value)
                    myCartHead.innerText = Number(myCartHead.innerText) - Number(quantity.value)
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) - Number(quantity.value)
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) - Number(quantity.value)
                    subTotal.innerText = Math.round((Number(subTotal.innerText) - (Number(quantity.value) * price) ) * 100) / 100
                    subTotalInCart.innerText = Math.round((Number(subTotalInCart.innerText) -  (Number(quantity.value) * price) ) * 100) / 100
                    tax.innerText = Math.round((Number(subTotalInCart.innerText) * 0.05) * 100) / 100
                    grandTotal.innerText = Math.round((Number(subTotalInCart.innerText) + Number(tax.innerText) + shipping) * 100) / 100
                    iziToast.error({
                        title : "Cart",
                        message : data.specMessage,
                        position : "topRight"
                    })
                   
                   
                }else{
                    iziToast.info({
                        title : "Cart",
                        message : data.message,
                        position : "topRight"
                    })
                    
                }
            })
           
        }
        
    }
    function decrementQuantity(cartId,productId,variantIndex){
        const shipping = 10
        let quantity = document.getElementById(`quantity${cartId}`)
        let price = document.getElementById(`price${cartId}${variantIndex}`).innerText
        let cartItemQtyToBeUpdated = document.getElementById(`cartItemQty${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let myCartHeadInCart = document.getElementById("cartHeadItemCountInCart")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
        let subTotalInCart = document.getElementById("subTotalInCart")
        let subTotalItemsInCart = document.getElementById("subTotalItemsInCart")
        let tax = document.getElementById("tax")
        let grandTotal = document.getElementById("grandTotal")
        let counter = parseInt(quantity.value)
        counter--
       
        if(counter < 1){
            iziToast.warning({
                title: "Invalid Quantity",
                message: "Quantity cannot be less than 1, Click Remove to delete the item.",
                position : "topRight"
            });
        }else{
            fetch(`/cart/update-cart-item?productId=${productId}&variant=${variantIndex}&quantity=${counter}`,{method : "PATCH"})
            .then(res => res.json())
            .then(data => {
                if (data.message === "Quantity has been updated in Cart") {
                    subTotal.innerText = Math.round((Number(subTotal.innerText) - ( (Number(quantity.value) * price) - (counter * price))) * 100) / 100
                    subTotalInCart.innerText = Math.round((Number(subTotalInCart.innerText) - ( (Number(quantity.value) * price) - (counter * price))) * 100) / 100
                    tax.innerText = Math.round((Number(subTotalInCart.innerText) * 0.05) * 100) / 100
                    quantity.value = counter
                    cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) - 1
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - 1
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) - 1
                    myCartHead.innerText = Number(myCartHead.innerText) - 1
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) - 1
                    grandTotal.innerText = Math.round((Number(subTotalInCart.innerText) + Number(tax.innerText) + shipping) * 100) / 100
                    feather.replace()
                    
                }else if(data.message === "Out of Stock" || data.message === "Product Unavailable"){
                    document.getElementById(`incDecQtyDiv${cartId}`).innerHTML = `
                     <button  type="button" class="text-center w-full rounded-lg px-2 py-2 bg-red-400 font-bold text-black mr-1 " >
                                 ${data.message}
                             </button> `
                    cartItemQtyToBeUpdated.classList.remove("text-black")
                    cartItemQtyToBeUpdated.classList.add("text-red-500")
                    cartItemQtyToBeUpdated.innerText = data.message
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - Number(quantity.value)
                    myCartHead.innerText = Number(myCartHead.innerText) - Number(quantity.value)
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) - Number(quantity.value)
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) - Number(quantity.value)
                    subTotal.innerText = Math.round((Number(subTotal.innerText) - (Number(quantity.value) * price) ) * 100 ) / 100
                    subTotalInCart.innerText = Math.round((Number(subTotalInCart.innerText) -  (Number(quantity.value) * price) ) * 100) / 100
                    tax.innerText = Math.round((Number(subTotalInCart.innerText) * 0.05) * 100) / 100
                    grandTotal.innerText = Math.round((Number(subTotalInCart.innerText) + Number(tax.innerText) + shipping) * 100) / 100
                    iziToast.error({
                        title : "Cart",
                        message : data.specMessage,
                        position : "topRight"
                    })
                   
                }else{
                    iziToast.info({
                        title : "Cart",
                        message : data.message,
                        position : "topRight"
                    })
                    
                }
            })
        }
        
    }
    const grandTotal = document.getElementById("grandTotal")
    if(grandTotal && Number(grandTotal.innerText) === 0){
     console.log( document.getElementById("checkoutBtnInCart"))
     document.getElementById("checkoutBtnInCart").onclick = function(){
         iziToast.info({
             title : "Cart",
             message : "Please add items to Cart",
             position : "topRight"
         })
     }
    }else if(grandTotal && Number(grandTotal.innerText) > 0){
       let isCouponApplied =  document.getElementById("isCouponApplied")
       console.log(isCouponApplied)
       if(isCouponApplied.value === "false"){
        fetch("/cart/remove-coupon",{method : "PATCH"})
       }
     document.getElementById("checkoutBtnInCart").onclick = function(){
         window.location.href = "/checkout"
     }
    }
    document.getElementById("cartHeadItemCountInCart").innerText = Number(document.getElementById("subTotalItemsInCart").innerText)


    let serverMessage = document.getElementById("serverMessage").value
    if(serverMessage ===  "Some items in your cart are unavailable. Please remove them to continue"){
        iziToast.info({
            title : "Cart",
            message : serverMessage,
            position : "topCenter"
        })
    }
      if(serverMessage !== "" && serverMessage !== "Some items in your cart are unavailable. Please remove them to continue"){
        
        serverMessage = serverMessage.split("_,")
       
      }
       if(Array.isArray(serverMessage)){
        for (let i = 0; i < serverMessage.length; i++) {
            if(i === serverMessage.length - 1){
                let stringLen = serverMessage[i].length - 1
                iziToast.error({
                title : "Stock Availability",
                message : serverMessage[i].slice(0,stringLen),
                position : "topRight"
            })
            }else{
                iziToast.error({
                title : "Stock Availability",
                message : serverMessage[i],
                position : "topRight"
              })
            }
            
        }
       }