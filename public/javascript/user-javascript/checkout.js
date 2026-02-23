document
  .getElementById("cashOnDeliveryBtn")
  .addEventListener("click", function () {
    let grandTotal = Number(document.getElementById("grandTotal").innerText);

    if (grandTotal < 100) {
      document.getElementById("placeOrderBtn").classList.remove("hidden");

      setTimeout(function () {
        document.getElementById("placeOrderBtn").classList.add("hidden");
      }, 10000);
    } else {
      iziToast.info({
        title: "Order",
        message:
          "Order amount greater than $100 will not be eligible for Cash on Delivery",
        position: "topRight",
      });
    }
  });

document
  .getElementById("payWithCardBtn")
  .addEventListener("click", function () {
    document.getElementById("paymentOverlay").classList.remove("hidden");
    document.getElementById("paymentMethod").value = "Pay with Stripe";
    document.getElementById("payWithCardBtn").type = "submit";
    document.getElementById("placeOrderBtn").type = "button";
    document.getElementById("payWithWalletBtn").type = "button";
    document.getElementById("orderForm").submit();
    document.getElementById("payWithCardBtn").disabled = true;
  });
document.getElementById("placeOrderBtn").addEventListener("click", function () {
  document.getElementById("paymentOverlay").classList.remove("hidden");
  document.getElementById("paymentMethod").value = "Cash on Delivery";
  document.getElementById("payWithCardBtn").type = "button";
  document.getElementById("placeOrderBtn").type = "submit";
  document.getElementById("payWithWalletBtn").type = "button";
  document.getElementById("orderForm").submit();
  document.getElementById("placeOrderBtn").disabled = true;
});
document
  .getElementById("payWithWalletBtn")
  .addEventListener("click", function () {
    document.getElementById("paymentOverlay").classList.remove("hidden");
    document.getElementById("paymentMethod").value = "Pay with NovaWallet";
    document.getElementById("payWithCardBtn").type = "button";
    document.getElementById("placeOrderBtn").type = "button";
    document.getElementById("payWithWalletBtn").type = "submit";
    document.getElementById("orderForm").submit();
    document.getElementById("payWithWalletBtn").disabled = true;
  });

let defaultAddressCard = document.getElementById("defaultAddressCard");
if (defaultAddressCard === null) {
  iziToast.info({
    title: "Address Required",
    message: "Please add a delivery address to continue checkout.",
    position: "topRight",
    timeout: 3000,
  });

  document.getElementById("addAddressModal").classList.remove("hidden");
  document.getElementById("cancelAddAddressModalBtn").classList.add("hidden");
  document.getElementById("closeAddAddressModalBtn").classList.add("hidden");
}
if (
  serverMessage ===
  "Insufficient Balance in NovaWallet, Please Top-up the wallet or Pay with Card"
) {
  iziToast.info({
    title: "Wallet",
    message: serverMessage,
    position: "topRight",
  });
}
if (
  serverMessage ===
  "Order amount greater than $100 will not be eligible for Cash on Delivery"
) {
  iziToast.info({
    title: "Order",
    message: serverMessage,
    position: "topRight",
  });
}
