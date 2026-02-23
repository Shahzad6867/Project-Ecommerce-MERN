feather.replace();

function updateProductStock(orderId, itemIndex, productVariant, quantity) {
  iziToast.question({
    theme: "light",
    title: "Update Stock",
    message:
      "Did you recieve the item ?<br>Did you inspect the Item ?<br>Is it Saleable ?",
    position: "topCenter",
    overlay: true,
    close: false,
    id: "updateStock",
    zindex: 9999,
    timeout: 30000,
    backgroundColor: "white",
    buttons: [
      [
        "<button>Confirm</button>",
        function (instance, toast) {
          instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          fetch(
            `/admin/orders/update-product-stock?orderId=${orderId}&itemIndex=${itemIndex}&productVariant=${productVariant}&quantity=${quantity}`,
            { method: "PATCH" }
          )
            .then((res) => (window.location.href = `/admin/orders/${orderId}`))
            .catch((error) =>
              iziToast.error({
                title: error.name,
                message: error.message,
                position: "topRight",
              })
            );
        },
      ],
      [
        "<button>Cancel</button>",
        function (instance, toast) {
          instance.hide({ transitionOut: "fadeOut" }, toast, "button");
          console.log("Deletion Cancelled");
        },
      ],
    ],
  });
}

function updateItemStatus(input, index) {
  if (input.value === "Return Request Declined") {
    document
      .getElementById(`declineItemReasonDiv${index}`)
      .classList.remove("hidden");
    document.getElementById(`declineItemReason${index}`).disabled = false;
  }
  if (input.value === "Return Request Approved" || input.value === "") {
    document
      .getElementById(`declineItemReasonDiv${index}`)
      .classList.add("hidden");
    document.getElementById(`declineItemReason${index}`).disabled = true;
  }
}

let serverMessage = document.getElementById("serverMessage").value;
if (serverMessage === "Status Updated Successfully") {
  iziToast.success({
    title: "Success",
    message: serverMessage,
    position: "topRight",
  });
}

function updateOrderItemStatus(btn, orderId, itemIndex) {
  let statusToBe = document.getElementById(`itemStatus${itemIndex}`).value;
  if (statusToBe !== "" && statusToBe !== "Return Request Declined") {
    btn.disabled = true;
    document.getElementById("updationOverlay").classList.remove("hidden");
    fetch(
      `/admin/orders/${orderId}/update-status?status=${statusToBe}&item=${itemIndex}`,
      { method: "PATCH" }
    ).then((res) => (window.location.href = `/admin/orders/${orderId}`));
  } else {
    let declineReason = document.getElementById(
      `declineItemReason${itemIndex}`
    ).value;
    if (declineReason === "" || declineReason === undefined) {
      iziToast.error({
        title: "Update Status",
        message: "Please provide a Decline Reason",
        position: "topRight",
      });
      event.preventDefault();
      return;
    }
    btn.disabled = true;
    document.getElementById("updationOverlay").classList.remove("hidden");
    fetch(
      `/admin/orders/${orderId}/update-status?status=${statusToBe}&item=${itemIndex}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          declineReason: declineReason,
        }),
      }
    ).then((res) => (window.location.href = `/admin/orders/${orderId}`));
  }
}
