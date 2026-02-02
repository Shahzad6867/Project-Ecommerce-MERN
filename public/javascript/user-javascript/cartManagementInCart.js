feather.replace();
    function applyCoupon(couponId,minAmount){
        console.log(minAmount)
        const grandTotal = document.getElementById("grandTotal").innerText
        if(Number(grandTotal) < Number(minAmount)){
            iziToast.info({
                title : "Coupon",
                message : `The minimum amount to apply this coupon is $${minAmount}`,
                position : "topRight"
            })
            event.preventDefault()
            return
        }
        fetch(`/cart/apply-coupon/${couponId}`,{method : "PATCH"})
        .then(res => res.json())
        .then(data => {
            if(data.message === "Done"){
                window.location.href = "/cart"
            }
        })
        .catch(error => { 
            iziToast.error({
                title : "Error",
                message : error.message,
                position : "topRight"
            })
        })
    }

    function removeCoupon(couponId){
        fetch(`/cart/remove-coupon`,{method : "PATCH"})
        .then(res => res.json())
        .then(data => {
            if(data.message === "Done"){
                window.location.href = "/cart"
            }
        })
        .catch(error => { 
            iziToast.error({
                title : "Error",
                message : error.message,
                position : "topRight"
            })
        })
    }

    function incrementQuantity(cartId,productId,variantIndex){
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
                    subTotal.innerText = (Number(subTotal.innerText) + ((counter * price) - (Number(quantity.value) * price))).toFixed(2)
                    subTotalInCart.innerText = (Number(subTotalInCart.innerText) + ((counter * price) - (Number(quantity.value) * price))).toFixed(2)
                    tax.innerText = (Number(subTotalInCart.innerText) * 0.05).toFixed(2)
                    quantity.value = counter
                    cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) + 1
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) + 1
                    myCartHead.innerText = Number(myCartHead.innerText) + 1
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) + 1
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) + 1
                    grandTotal.innerText = Number(subTotalInCart.innerText) + Number(tax.innerText)
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
                    subTotal.innerText = (Number(subTotal.innerText) - (Number(quantity.value) * price) ).toFixed(2)
                    subTotalInCart.innerText = (Number(subTotalInCart.innerText) -  (Number(quantity.value) * price) ).toFixed(2)
                    tax.innerText = (Number(subTotalInCart.innerText) * 0.05).toFixed(2)
                    grandTotal.innerText = Number(subTotalInCart.innerText) + Number(tax.innerText)
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
                    subTotal.innerText = (Number(subTotal.innerText) - ( (Number(quantity.value) * price) - (counter * price))).toFixed(2)
                    subTotalInCart.innerText = (Number(subTotalInCart.innerText) - ( (Number(quantity.value) * price) - (counter * price))).toFixed(2)
                    tax.innerText = (Number(subTotalInCart.innerText) * 0.05).toFixed(2)
                    quantity.value = counter
                    cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) - 1
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - 1
                    subTotalItemsInCart.innerText = Number(subTotalItemsInCart.innerText) - 1
                    myCartHead.innerText = Number(myCartHead.innerText) - 1
                    myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) - 1
                    grandTotal.innerText = Number(subTotalInCart.innerText) + Number(tax.innerText)
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
                    subTotal.innerText = (Number(subTotal.innerText) - (Number(quantity.value) * price) ).toFixed(2)
                    subTotalInCart.innerText = (Number(subTotalInCart.innerText) -  (Number(quantity.value) * price) ).toFixed(2)
                    tax.innerText = (Number(subTotalInCart.innerText) * 0.05).toFixed(2)
                    grandTotal.innerText = Number(subTotalInCart.innerText) + Number(tax.innerText)
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
      if(serverMessage !== ""){
        
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