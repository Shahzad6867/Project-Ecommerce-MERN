
const selectedOptionToViewTheList = async (req,res) => {
    try {
      const redirectTo = req.headers.referer.slice(21)
        const {itemsPerPage} = req.body
        req.session.itemsPerPage = itemsPerPage
        if(redirectTo){
          res.redirect(redirectTo)
        }else{
          res.redirect("/admin/users")
        }
       
    } catch (error) {
        console.log(error)
    }
  }

  module.exports = {
    selectedOptionToViewTheList
  }