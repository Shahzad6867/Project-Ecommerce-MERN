feather.replace();
function copyToClipboard() {
  const text = document.getElementById("referral-link").value;

  // Use the modern Clipboard API to copy
  navigator.clipboard
    .writeText(text)
    .then(() => {
      document.getElementById("copyBtn").innerText = "Copied";
      setTimeout(() => {
        document.getElementById("copyBtn").innerText = "Copy";
      }, 10000);
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
}
const serverMessage = document.getElementById("serverMessage").value;

if (serverMessage === "Password Updated Successfully") {
  iziToast.success({
    title: "Success",
    message: serverMessage,
    position: "topRight",
  });
}
if (serverMessage === "Email Updated Successfully") {
  iziToast.success({
    title: "Success",
    message: serverMessage,
    position: "topRight",
  });
}
if (serverMessage === "Profile Updated Successfully") {
  iziToast.success({
    title: "Success",
    message: serverMessage,
    position: "topRight",
  });
}

// Image preview for avatar upload
