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
        theme : "light",
        title : "Cancel Item",
        message : "Are you sure you want to cancel this item ?",
        position : "topCenter",
        overlay : true,
        close : false,
        id : "cancelItem",
        zindex : 9999,
        timeout : 30000,
        backgroundColor : "white", 
        buttons : [
            ["<button>OK</button>",function(instance,toast){
                instance.hide({transitionOut : "fadeOut"},toast,'button')
                removeProcessingRequestOverlay()
                fetch(`/orders/${orderId}/cancel-item?item=${itemId}`,{method : "PATCH"})
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
        theme : "light",
        title : "Cancel Order",
        message : "Are you sure you want to cancel this Order ?",
        position : "topCenter",
        overlay : true,
        close : false,
        id : "cancelOrder",
        zindex : 9999,
        timeout : 30000,
        backgroundColor : "white", 
        buttons : [
            ["<button>OK</button>",function(instance,toast){
                instance.hide({transitionOut : "fadeOut"},toast,'button')
                removeProcessingRequestOverlay()
                fetch(`/orders/${orderId}/cancel-order`,{method : "PATCH"})
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