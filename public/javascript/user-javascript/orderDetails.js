feather.replace();
        function openReturnModalForOrder(orderId){
            document.getElementById("returnModalHeading").innerText = "Return Order"
            document.getElementById("returnModal").style.display = "block"
             document.getElementById("returnForm").action = `/orders/${orderId}/return-order`
        }
        function openReturnModalForItem(orderId,itemIndex){
            document.getElementById("returnModalHeading").innerText = "Return Item"
            document.getElementById("returnModal").style.display = "block"
             document.getElementById("returnForm").action = `/orders/${orderId}/return-item?itemIndex=${itemIndex}`
        }
        function closeReturnModal() {
            document.getElementById("returnModal").style.display = "none"
        }
        document.getElementById("returnForm").addEventListener("submit",function(e){
            let returnReason = document.getElementById("returnReason").value
            let uploadImage = document.getElementById("returnOrderMedia")
            if(returnReason === ""){
                iziToast.error({
                    title : "Error",
                    message : "Please select a reason",
                    position : "topRight"
                })
                e.preventDefault()
                return
            }else{
                if(returnReason === "Other"){
                   let returnMessage = document.getElementById("returnMessage").value
                    if(returnMessage === ""){
                        iziToast.error({
                        title : "Error",
                        message : "Please provide a reason",
                        position : "topRight"
                    })
                    e.preventDefault()
                    return
                   }
                }
            }
            if (uploadImage.files.length === 0) {
                iziToast.error({
                        title : "Error",
                        message : "Please upload an image of the item in its current condition to verify your return request",
                        position : "topRight",
                        timeout : 5000
                    })
                    e.preventDefault()
                    return
            }
            document.getElementById("cancelReturnBtn").disabled = true
            document.getElementById("submitReturnBtn").disabled = true
        })
        function enableTextBox(){
            let returnReason = document.getElementById("returnReason").value
            if(returnReason === "Other"){
                document.getElementById("returnMessage").disabled = false
                document.getElementById("returnMessage").classList.remove("hidden") 
                document.getElementById("returnReason").name = ""
                document.getElementById("returnMessage").name = "returnReason"
            }else{
                document.getElementById("returnMessage").disabled = true
                document.getElementById("returnMessage").classList.add("hidden") 
                document.getElementById("returnReason").name = "returnReason"
                document.getElementById("returnMessage").name = ""
            }
        }
       
        function cancelItem(orderId,itemId){
            iziToast.question({
                timeout: false,
                close: false,
                overlay: true,
                theme : "light",
                displayMode: 'once',
                id: 'cancel-item',
                zindex: 999,
                title: 'Cancel Item',
                message: 'Please select a reason:',
                backgroundColor : "white", 
                position: 'center',
                inputs: [
                    ['<div id="cancel-reasons" style="text-align: left; margin-top: 10px;">' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Ordered by mistake"> Ordered by mistake</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Found a better price elsewhere"> Found a better price elsewhere</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Delivery time is too long"> Delivery time is too long</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Changed my mind"> Changed my mind</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Ordered the wrong item / quantity"> Ordered the wrong item / quantity</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Need to change shipping address"> Need to change shipping address</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Item no longer needed"> Item no longer needed</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="other"> Other (please specify)</label>' +
                        '<textarea type="text" id="other-reason" rows=2 maxlength="200" placeholder="Type reason here..." style="display:none; width:100%; margin-top:10px; padding:5px;"></textarea>' +
                    '</div>', 'change', function (instance, toast, input, e) {
                        const otherInput = toast.querySelector('#other-reason');
                        const isOther = toast.querySelector('input[name="reason"]:checked').value === 'other';
                        
                        // Toggle the text box visibility
                        otherInput.style.display = isOther ? 'block' : 'none';
                        if (isOther) otherInput.focus();
                    }]
                ],
                buttons: [
                    ['<button>OK</button>', function (instance, toast) {
                        const selectedRadio = toast.querySelector('input[name="reason"]:checked');
                        let finalReason = selectedRadio ? selectedRadio.value : null;
            
                        if (finalReason === 'other') {
                            finalReason = toast.querySelector('#other-reason').value.trim();
                        }
            
                        if (!finalReason) {
                            iziToast.error({ title: 'Error', message: 'Please provide a reason.',position : "topRight" });
                            return;
                        }
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                        removeProcessingRequestOverlay()
                        fetch(`/orders/${orderId}/cancel-item?item=${itemId}`,{method : "PATCH",
                            headers : {
                                "Content-Type" : "application/json"
                            },
                            body : JSON.stringify({
                                reason : finalReason
                            })
                        })
                        .then(res => window.location.href = `/orders/${orderId}` )
                        .catch(error => iziToast.error({
                            title : error.name ,
                            message : error.message,
                            position : "topRight"
                        }))

                    }],
                    ["<button>Cancel</button>",function(instance,toast){
                        instance.hide({transitionOut : "fadeOut"},toast,'button')
                        console.log("Deletion Cancelled")
                    }]
                ]
            })
        }

        function cancelOrder(orderId){
            iziToast.question({
                timeout: false,
                close: false,
                overlay: true,
                theme : "light",
                displayMode: 'once',
                id: 'cancel-order',
                zindex: 999,
                title: 'Cancel Order',
                message: 'Please select a reason:',
                backgroundColor : "white", 
                position: 'center',
                inputs: [
                    ['<div id="cancel-reasons" style="text-align: left; margin-top: 10px;">' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Ordered by mistake"> Ordered by mistake</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Found a better price elsewhere"> Found a better price elsewhere</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Delivery time is too long"> Delivery time is too long</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Changed my mind"> Changed my mind</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Ordered the wrong item / quantity"> Ordered the wrong item / quantity</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Need to change shipping address"> Need to change shipping address</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="Item no longer needed"> Item no longer needed</label>' +
                        '<label style="display:block;"><input type="radio" name="reason" value="other"> Other (please specify)</label>' +
                        '<textarea type="text" id="other-reason" rows=2 maxlength="200" placeholder="Type reason here..." style="display:none; width:100%; margin-top:10px; padding:5px;"></textarea>' +
                    '</div>', 'change', function (instance, toast, input, e) {
                        const otherInput = toast.querySelector('#other-reason');
                        const isOther = toast.querySelector('input[name="reason"]:checked').value === 'other';
                        
                        // Toggle the text box visibility
                        otherInput.style.display = isOther ? 'block' : 'none';
                        if (isOther) otherInput.focus();
                    }]
                ],
                buttons: [
                    ['<button>OK</button>', function (instance, toast) {
                        const selectedRadio = toast.querySelector('input[name="reason"]:checked');
                        let finalReason = selectedRadio ? selectedRadio.value : null;
            
                        if (finalReason === 'other') {
                            finalReason = toast.querySelector('#other-reason').value.trim();
                        }
            
                        if (!finalReason) {
                            iziToast.error({ title: 'Error', message: 'Please provide a reason.',position : "topRight" });
                            return;
                        }
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                        removeProcessingRequestOverlay()
                        fetch(`/orders/${orderId}/cancel-order`,{method : "PATCH",
                            headers : {
                                "Content-Type" : "application/json"
                            },
                            body : JSON.stringify({
                                reason : finalReason
                            })
                        })
                        .then(res => window.location.href = `/orders/${orderId}` )
                        .catch(error => iziToast.error({
                            title : error.name ,
                            message : error.message,
                            position : "topRight"
                        }))

                    }, true],
                    ['<button>Cancel</button>', function (instance, toast) {
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    }]
                ]
            });
            
    }


        function removeProcessingRequestOverlay (){
            document.getElementById("processingRequestOverlay").classList.remove("hidden")
        }


        function reorder(cartId){
            
                    fetch(`/cart/reorder?orderId=${cartId}`,{method : "POST"})
                .then(res => window.location.href = "/cart")
                .catch(error => {
                    iziToast.error({
                        title : "Error",
                        message : error.message,
                        position : "topRight"
                    })
                    
                })
                
        }

        const serverMessage = document.getElementById("serverMessage").value
        if(serverMessage === "Item has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."){
            iziToast.info({
                title : "Order",
                message : serverMessage,
                position : "topRight"
            })
        }else if(serverMessage === "Order has been successfully cancelled.<br>Any applicable refund will be processed according to our refund policy."){
            iziToast.info({
                title : "Order",
                message : serverMessage,
                position : "topRight"
            })
        }else if(serverMessage === "Please provide proof for Return Request"){
            iziToast.info({
                title : "Order",
                message : serverMessage,
                position : "topRight"
            })
        }