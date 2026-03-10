feather.replace();

function setAccordingToDiscountType() {
  const discountType = document.getElementById("discountType");
  const maxDiscountAmount = document.getElementById("maxDiscountAmount");
  const discountValue = document.getElementById("discountValue");

  if (discountType.value === "flat") {
    maxDiscountAmount.disabled = true;
    discountValue.placeholder =
      "How much amount are you willing to give Discount";
  } else if (discountType.value === "percentage") {
    maxDiscountAmount.disabled = false;
    discountValue.placeholder =
      "How much percentage are you willing to give Discount";
  } else {
    discountValue.placeholder = "Select Discount Type";
  }
}

function fillMaxDiscountOnFlat() {
  const maxDiscountAmount = document.getElementById("maxDiscountAmount");
  const discountType = document.getElementById("discountType");
  const discountValue = document.getElementById("discountValue");
  if (discountType.value === "flat") {
    maxDiscountAmount.value = Number(discountValue.value);
  }
}

// Form submission
function previewImage(input) {
  const preview = document.getElementById("previewImg");
  const previewContainer = document.getElementById("imagePreview");

  if (!input.files || !input.files[0]) {
    previewContainer.classList.add("hidden");
    return;
  }

  const file = input.files[0];

  // Optional: file type validation
  if (!file.type.startsWith("image/")) {
    iziToast.error({
      title: "Invalid File",
      message: "Please upload a valid image file",
      position: "topCenter",
    });
    input.value = "";
    previewContainer.classList.add("hidden");
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
          title: "Invalid Image Size",
          message: `Banner image must be exactly ${requiredWidth} × ${requiredHeight}px`,
          position: "topCenter",
        });

        input.value = "";
        preview.src = "";
        previewContainer.classList.add("hidden");
        return;
      }

      // Valid image
      preview.src = e.target.result;
      previewContainer.classList.remove("hidden");
    };
  };

  reader.readAsDataURL(file);
}

 function validateCouponForm() {
  // Validate form

  const couponName = document.getElementById("couponName").value;
  const endDate = document.getElementById("endDate").value;
  const discountType = document.getElementById("discountType").value;
  const discountValue = document.getElementById("discountValue").value;
  const minAmount = document.getElementById("minAmount").value;
  const maxDiscountAmount = document.getElementById("maxDiscountAmount").value;
  const description = document.getElementById("description").value;

  const now = new Date();
  const end = new Date(endDate);

  if (couponName === "") {
    iziToast.error({
      title: "Error",
      message: "Please enter a Coupon Name",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  if (description === "") {
    iziToast.error({
      title: "Error",
      message: "Please enter a Description",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  if (endDate === "") {
    iziToast.error({
      title: "Error",
      message: "Please select a Valid End Date and Time",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }
  if (end <= now) {
    iziToast.error({
      title: "Error",
      message: "Please select a Future End Date and Time ",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }
  if (discountValue === "") {
    iziToast.error({
      title: "Error",
      message: "Please enter a Discount Value",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  if (discountType === "") {
    iziToast.error({
      title: "Error",
      message: "Please select a Discount Type",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  if (discountType === "percentage" && discountValue > 70) {
    iziToast.error({
      title: "Error",
      message: "Please enter a Discount Percentage that is less than 70",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  if (discountType === "flat" && discountValue > 120) {
    iziToast.error({
      title: "Error",
      message: "Please enter a Flat Discount that is less than 120",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }
  if (minAmount === "") {
    iziToast.error({
      title: "Error",
      message:
        "Please enter a Minimum Order Amount that the coupon can be Applied",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }
  if (maxDiscountAmount === "") {
    iziToast.error({
      title: "Error",
      message:
        "Please enter a Maximum Discount that the coupon can apply on Order amount.",
      position: "topCenter",
    });
    event.preventDefault();
    return false;
  }

  document.getElementById("maxDiscountAmount").disabled = false;
  return true;
}
function updateCoupon(){
  if(validateCouponForm()){
      fetch(document.getElementById("couponForm").action , {
          method : "PUT",
          body : new FormData(document.getElementById("couponForm"))
      }).then(res => window.location.href = "/admin/coupons")
  }
 }
