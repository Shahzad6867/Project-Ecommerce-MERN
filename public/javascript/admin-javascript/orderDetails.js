feather.replace();

        function updateProductStock(orderId,itemIndex,productVariant,quantity){
            iziToast.question({
                theme : "light",
                title : "Update Stock",
                message : "Did you recieve the item ?<br>Did you inspect the Item ?<br>Is it Saleable ?",
                position : "topCenter",
                overlay : true,
                close : false,
                id : "updateStock",
                zindex : 9999,
                timeout : 30000,
                backgroundColor : "white", 
                buttons : [
                    ["<button>Confirm</button>",function(instance,toast){
                        instance.hide({transitionOut : "fadeOut"},toast,'button')
                        fetch(`/admin/orders/update-product-stock?orderId=${orderId}&itemIndex=${itemIndex}&productVariant=${productVariant}&quantity=${quantity}`,{method : "PATCH"})
                        .then(res => window.location.href = `/admin/orders/${orderId}` )
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

        document.getElementById("orderUpdateStatus").addEventListener("change",function () {
            if(this.value === "Decline Return Request"){
                document.getElementById("declineReasonDiv").classList.remove("hidden") 
                document.getElementById("declineReasonTextBox").disabled = false
            }
            if(this.value === "Approve Return Request"){
                document.getElementById("declineReasonDiv").classList.add("hidden") 
                document.getElementById("declineReasonTextBox").disabled = true
            }
        })

        document.getElementById("updateOrderItemStatus").addEventListener("change",function () {
            if(this.value === "Decline Return Request"){
                document.getElementById("declineItemReasonDiv").classList.remove("hidden") 
                document.getElementById("declineItemReason").disabled = false
            }
            if(this.value === "Approve Return Request"){
                document.getElementById("declineItemReasonDiv").classList.add("hidden") 
                document.getElementById("declineItemReason").disabled = true
            }
        })
        

        let serverMessage = document.getElementById("serverMessage").value
        if(serverMessage === "Status Updated Successfully"){
            iziToast.success({
                title : "Success",
                message : serverMessage,
                position : "topRight"
            })
        }  
        
        function updateStatus(orderId){
            
          let statusToBe = document.getElementById("orderUpdateStatus").value
          if(statusToBe !== "" && statusToBe === "Processed"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{method : "PATCH"})
            .then(res => window.location.href = `/admin/orders/${orderId}`)
          }else if(statusToBe !== "" && statusToBe === "Shipped"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{method : "PATCH"})
            .then(res => window.location.href = `/admin/orders/${orderId}`)
            .catch(error => {
                console.log(error)
            })
          }else if(statusToBe !== "" && statusToBe === "Out for Delivery"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{method : "PATCH"})
            .then(res => window.location.href =`/admin/orders/${orderId}`)
          }else if(statusToBe !== "" && statusToBe === "Delivered"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{method : "PATCH"})
            .then(res => window.location.href = `/admin/orders/${orderId}`)
          }else if(statusToBe !== "" && statusToBe === "Approve Return Request"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{method : "PATCH"})
            .then(res => window.location.href = `/admin/orders/${orderId}`)
          }else if(statusToBe !== "" && statusToBe === "Decline Return Request"){
            let declineReason = document.getElementById("declineReasonTextBox").value
            if(declineReason === "" || declineReason === undefined){
                iziToast.error({
                    title : "Update Status",
                    message : "Please provide a Decline Reason",
                    position : "topRight"
                })
                event.preventDefault()
                return
            }
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-status?status=${statusToBe}`,{
                method : "PATCH",
                headers : {
                   'Content-Type': 'application/json'
                },
                body : JSON.stringify({
                    declineReason : declineReason
                })
            })
            .then(res => window.location.href = `/admin/orders/${orderId}`)
          }
        }

        function updateOrderItemStatus(orderId,itemIndex){
            let updateItemStatus = document.getElementById("updateOrderItemStatus")
            if(updateItemStatus.value === ""){
                iziToast.error({
                    title : "Update Item Status",
                    message : "Please select an option",
                    position : "topRight"
                })
                event.preventDefault()
                return
            }
            if(updateItemStatus.value !== "" && updateItemStatus.value === "Approve Return Request"){
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-item-status?status=${updateItemStatus.value}&itemIndex=${itemIndex}`,{method : "PATCH"})
                .then(res => window.location.href = `/admin/orders/${orderId}`)
                .catch(error => console.log(error))
          }
          if(updateItemStatus.value !== "" && updateItemStatus.value === "Decline Return Request"){
            let declineReason = document.getElementById("declineItemReason").value
            if(declineReason === "" || declineReason === undefined){
                iziToast.error({
                    title : "Update Item Status",
                    message : "Please provide a Decline Reason",
                    position : "topRight"
                })
                event.preventDefault()
                return
            }
            document.getElementById("updateStatusBtn").disabled = true
            document.getElementById("updationOverlay").classList.remove("hidden")
            fetch(`/admin/orders/${orderId}/update-item-status?status=${updateItemStatus.value}&itemIndex=${itemIndex}`,{
                method : "PATCH",
                headers : {
                   'Content-Type': 'application/json'
                },
                body : JSON.stringify({
                    declineReason : declineReason
                })
            })
                .then(res => window.location.href = `/admin/orders/${orderId}`)
                .catch(error => console.log(error))
          }
               
            
        }