

    function addToCartInitially(input,item,variant,productId){
        let cartItemQty = document.getElementById("cartItemQty")
        let cartItemsDiv = document.getElementById("cartItemsDiv")
        let myCartHead = document.getElementById("cartHeadItemCount")
        let subTotal = document.getElementById("subTotal")
        console.log(cartItemsDiv)
        let nothingInCartCard = document.getElementById("nothingInCartCard")
        fetch(`/cart?productId=${productId}&variant=${variant}&quantity=1`,{method : "POST"})
        .then(res => res.json())
        .then(data => {
             
            if (data.message === "Product has been added to Cart") {
                input.disabled = false
                input.classList.remove("w-full")
                input.classList.remove("py-2")
                input.innerText = ""
                input.classList.add("w-[0%]")
                document.getElementById(`incDecQtyDiv${productId}${variant}`).classList.remove("hidden")
                if(Number(cartItemQty.innerText) === 0){
                    document.getElementById("checkoutBtn").disabled = false
                    document.getElementById("checkoutBtn").onclick = function(){ window.location.href = "/checkout" }
                    
                }
                cartItemQty.innerText = Number(cartItemQty.innerText) + 1
                myCartHead.innerText = Number(myCartHead.innerText) + 1
                if(nothingInCartCard){
                    nothingInCartCard.remove()
                }
                if(data.product.productName.length > 29){
                    data.product.productName = data.product.productName.slice(0,26) + "..."
                }
                cartItemsDiv.innerHTML = `<div id="cartItem${data.product._id}${variant}" >
                                            <input  type="text" value="${data.cart._id}" hidden></input>
                                            <div class="flex  border border-gray-400 w-[96%] text-left px-3 py-2 text-gray-700  rounded-lg m-2">
                                                <a href="/product?id=${data.product._id}&variant=${variant}" >
                                                    <div class="w-[6rem]">
                                                    <img src="${data.product.variants[variant].productImages[0]}" class="rounded-md mr-1 w-full border border-gray-400 "></img>
                                                   </div>
                                                </a>
                                               
                                                <div class="w-[78%] ml-1">
                                                      <a href="/product?id=${data.product._id}&variant=${variant}" >
                                                         <h1 class="font-bold text-black">${data.product.productName}</h1>
                                                         <p class="text-gray-600 text-xs">Color : <strong class="text-black">${data.product.variants[variant].color}</strong><span class="ml-2">Size : <strong class="text-black">${data.product.variants[variant].size}</strong></span></p>
                                                         <p class="text-sm text-gray-600 mt-[0.1rem]">Quantity : <strong class="text-black font-bold" id="cartItemQty${productId}${variant}">1</strong></p>
                                                     </a>
                                                    <div class="flex justify-between items-center mt-1">
                                                        <h2 class="text-lg text-black font-bold ">$ ${data.product.variants[variant].price}</h2>
                                                       
                                                            <button type="button" class="text-sm  flex items-center justify-center rounded-lg hover:text-red-500  px-2 z-50  text-black" onclick="deleteItemFromCart('${data.cart._id}','${data.product._id}',${variant})">
                                                                <i data-feather="trash-2" class="w-5 h-5 mr-1"></i>
                                                            </button>
                                                      
                                                    </div>
                                                </div> 
                                                
                                            </div>
                                        </div>` + cartItemsDiv.innerHTML
                    subTotal.innerText = (Number(subTotal.innerText) + data.product.variants[variant].price).toFixed(2)
                    feather.replace()
                    iziToast.info({
                        title : "Cart",
                        message : data.message,
                        position : "topRight"
                    })  
            }else if(data.message === "Product Unavailable"){
                input.classList.remove(...input.classList)
                input.classList.add("py-2")
                input.classList.add("bg-red-400")
                input.classList.add("font-bold")
                input.classList.add("w-full")
                input.classList.add("rounded-lg")
                input.innerText = data.message
                input.disabled = true
            }else if(data.message === "Out of Stock"){
                input.classList.remove(...input.classList)
                input.classList.add("py-2")
                input.classList.add("bg-red-400")
                input.classList.add("font-bold")
                input.classList.add("w-full")
                input.classList.add("rounded-lg")
                input.innerText = "Out of Stock"
                input.disabled = true
                iziToast.error({
                    title : "Cart",
                    message : data.specMessage,
                    position : "topRight"
                })
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
    

    function incrementQuantity(productIndex,variantIndex,productId){
        let quantity = document.getElementById(`quantity${productId}${variantIndex}`)
        let addToCartBtn = document.getElementById(`addToCartBtn${productId}${variantIndex}`)
        let cartItemQtyToBeUpdated = document.getElementById(`cartItemQty${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
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
                    subTotal.innerText = (Number(subTotal.innerText) + ((counter * data.product.variants[variantIndex].price) - (Number(quantity.value) * data.product.variants[variantIndex].price))).toFixed(2)
                    quantity.value = counter
                    cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) + 1
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) + 1
                    myCartHead.innerText = Number(myCartHead.innerText) + 1
                    feather.replace()
                    
                }else if(data.message === "Out of Stock"){
                    document.getElementById(`incDecQtyDiv${productId}${variantIndex}`).classList.add("hidden")
                    addToCartBtn.classList.remove(...addToCartBtn.classList)
                    addToCartBtn.classList.add("py-2")
                    addToCartBtn.classList.add("bg-red-400")
                    addToCartBtn.classList.add("font-bold")
                    addToCartBtn.classList.add("w-full")
                    addToCartBtn.classList.add("rounded-lg")
                    addToCartBtn.innerText = "Out of Stock"
                    cartItemQtyToBeUpdated.classList.remove("text-black")
                    cartItemQtyToBeUpdated.classList.add("text-red-500")
                    cartItemQtyToBeUpdated.innerText = "Out of Stock"
                    cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - 1
                    myCartHead.innerText = Number(myCartHead.innerText) - 1
                    addToCartBtn.disabled = true
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
            .catch(error => {
                console.log(error)
            })
           
            
        }
        
    }
    function decrementQuantity(productIndex,variantIndex,productId){
        let quantity = document.getElementById(`quantity${productId}${variantIndex}`)
        let addToCartBtn = document.getElementById(`addToCartBtn${productId}${variantIndex}`)
        let cartItemQtyToBeUpdated = document.getElementById(`cartItemQty${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
        let cartItem = document.getElementById(`cartItem${productId}${variantIndex}`)
        let cartId = document.querySelector(`#cartItem${productId}${variantIndex} input`).value
        let counter = parseInt(quantity.value)
        counter --
        if(counter < 1){
            
                fetch(`/cart/delete-cart-item?cartItemId=${cartId}&productId=${productId}`,{method : "DELETE"})
                .then(res => res.json())
                .then(data => {
                    addToCartBtn.classList.add("w-full")
                addToCartBtn.classList.add("py-2")
                addToCartBtn.innerHTML = '<i data-feather="shopping-cart" class="w-4 h-4 mr-2"></i> Add to Cart'
                addToCartBtn.classList.remove("w-[0%]")
                document.getElementById(`incDecQtyDiv${productId}${variantIndex}`).classList.add("hidden")
                myCartHead.innerText = Number(myCartHead.innerText) - 1
                cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - 1
                subTotal.innerText = (Number(subTotal.innerText) - ( (Number(quantity.value) * data.product.variants[variantIndex].price) - (counter * data.product.variants[variantIndex].price))).toFixed(2)
                cartItem.remove()
                if(Number(cartItemQtyNotifier.innerText) === 0){
                    document.getElementById("checkoutBtn").disabled = true
                }
                if(document.getElementById("cartItemsDiv").children.length === 0){
                    document.getElementById("cartItemsDiv").innerHTML = `<div id="nothingInCartCard" class="flex  items-center justify-center border border-gray-400 w-[96%] text-left px-3 py-8 text-gray-700  rounded-lg m-2">
                                                                    <h1 class="font-bold">
                                                                        Your cart is empty. Start shopping!
                                                                    </h1>
                                                                </div>`
                }
                feather.replace()
                iziToast.info({
                    title: "Cart",
                    message: data.message,
                    position : "topRight"
                });
                })
        }else{
            fetch(`/cart/update-cart-item?productId=${productId}&variant=${variantIndex}&quantity=${counter}`,{method : "PATCH"})
            .then(res => res.json())
            .then(data => {
                subTotal.innerText = (Number(subTotal.innerText) - ( (Number(quantity.value) * data.product.variants[variantIndex].price) - (counter * data.product.variants[variantIndex].price))).toFixed(2)
                quantity.value = counter
                cartItemQtyToBeUpdated.innerText = Number(cartItemQtyToBeUpdated.innerText) - 1
                cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - 1
                myCartHead.innerText = Number(myCartHead.innerText) - 1
                
            })
            .catch(error => {
                console.log(error)
            })
        }
        
    }
    function deleteItemFromCart(cartId,productId,variantIndex) {
        let quantity = document.getElementById(`quantity${productId}${variantIndex}`)
        let addToCartBtn = document.getElementById(`addToCartBtn${productId}${variantIndex}`)
        let cartItemQtyToBeUpdated = document.getElementById(`cartItemQty${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
        let cartItem = document.getElementById(`cartItem${productId}${variantIndex}`)
        fetch(`/cart/delete-cart-item?cartItemId=${cartId}&productId=${productId}`,{method : "DELETE"})
                .then(res => res.json())
                .then(data => {
                    addToCartBtn.classList.add("w-full")
                addToCartBtn.classList.add("py-2")
                addToCartBtn.innerHTML = '<i data-feather="shopping-cart" class="w-4 h-4 mr-2"></i> Add to Cart'
                addToCartBtn.classList.remove("w-[0%]")
                document.getElementById(`incDecQtyDiv${productId}${variantIndex}`).classList.add("hidden")
                myCartHead.innerText = Number(myCartHead.innerText) - Number(quantity.value)
                cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - Number(quantity.value)
                quantity.value = 1
                subTotal.innerText = (Number(subTotal.innerText) -  (Number(quantity.value) * data.product.variants[variantIndex].price) ).toFixed(2)
                cartItem.remove()
                if(document.getElementById("cartItemsDiv").children.length === 0){
                    document.getElementById("cartItemsDiv").innerHTML = `<div id="nothingInCartCard" class="flex  items-center justify-center border border-gray-400 w-[96%] text-left px-3 py-8 text-gray-700  rounded-lg m-2">
                                                                    <h1 class="font-bold">
                                                                        Your cart is empty. Start shopping!
                                                                    </h1>
                                                                </div>`
                }
                feather.replace()
                iziToast.info({
                    title: "Cart",
                    message: data.message,
                    position : "topRight"
                });
                })
    }

    function deleteItemInCartFromCart(cartId,productId,variantIndex) {
        let quantity = document.getElementById(`quantity${productId}${variantIndex}`)
        let myCartHead = document.getElementById("cartHeadItemCount")
        let myCartHeadInCart = document.getElementById("cartHeadItemCountInCart")
        let cartItemQtyNotifier = document.getElementById("cartItemQty")
        let subTotal = document.getElementById("subTotal")
        let cartItem = document.getElementById(`cartItem${productId}${variantIndex}`)
        let cartItemInCart = document.getElementById(`cartItemInCart${cartId}`)
        let subTotalItemInCart = document.getElementById("subTotalItemsInCart")
        let subTotalInCart = document.getElementById("subTotalInCart")
        let tax = document.getElementById("tax")
        let grandTotal = document.getElementById("grandTotal")
        let cartItemsList = document.getElementById("cartItemsList")
        fetch(`/cart/delete-cart-item?cartItemId=${cartId}&productId=${productId}`,{method : "DELETE"})
                .then(res => res.json())
                .then(data => {
                  
                myCartHead.innerText = Number(myCartHead.innerText) - Number(quantity.value)
                cartItemQtyNotifier.innerText = Number(cartItemQtyNotifier.innerText) - Number(quantity.value)
                myCartHeadInCart.innerText = Number(myCartHeadInCart.innerText) - Number(quantity.value)
                subTotalItemInCart.innerText = Number(subTotalItemInCart.innerText) - Number(quantity.value)
                subTotal.innerText = (Number(subTotal.innerText) -  (Number(quantity.value) * data.product.variants[variantIndex].price) ).toFixed(2)
                subTotalInCart.innerText =(Number(subTotalInCart.innerText) -  (Number(quantity.value) * data.product.variants[variantIndex].price) ).toFixed(2)
                tax.innerText = (Number(subTotalInCart.innerText) * 0.05 ).toFixed(2)
                cartItem.remove()
                if(document.getElementById("cartItemsDiv").children.length === 0){
                    document.getElementById("cartItemsDiv").innerHTML = `<div id="nothingInCartCard" class="flex  items-center justify-center border border-gray-400 w-[96%] text-left px-3 py-8 text-gray-700  rounded-lg m-2">
                                                                    <h1 class="font-bold">
                                                                        Your cart is empty. Start shopping!
                                                                    </h1>
                                                                </div>`
                }
                grandTotal.innerText = (Number(subTotalInCart.innerText) + Number(tax.innerText)).toFixed(2)
                cartItemInCart.remove()
                if(Number(subTotal.innerText) === 0){
                    document.getElementById("checkoutBtnInCart").disabled = true
                }
                if(cartItemsList.children.length === 0){
                    cartItemsList.innerHTML = `<div class="bg-white rounded-lg border shadow-sm w-full min-h-[40%]  p-6">
                    <div class="border-2 w-full h-[196px]  rounded-lg">
                        <h1 class="text-2xl font-bold ml-[10rem] mt-[3.8rem]">Looks like you haven’t added anything yet !</h1>
                        <a href="/shop"><button type="button"  class="btn-primary ml-[22rem] flex font-bold rounded-full px-4 py-2 mt-1 "><i data-feather="shopping-cart" class="mr-2"></i>Shop Now</button></a>
                    </div>
                </div>`
                }
                feather.replace()
                iziToast.info({
                    title: "Cart",
                    message: data.message,
                    position : "topRight"
                });
                })
    }
    
    
   