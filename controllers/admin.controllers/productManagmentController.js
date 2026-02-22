const Product = require("../../models/product.model.js");
const {extractPublicId} = require("cloudinary-build-url")
const productService = require("../../services/admin-services/productService.js")
const ERROR_MESSAGES = require("../../constants/errorMessages.js")
const HTTP_STATUS = require("../../constants/httpStatus.js")

const getProducts = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const productsFullList = await productService.getProductsForSearch()
     const products = await productService.getProducts(perPage,page)
     const count = await productService.getProductsCount()
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    let result = await Product.aggregate([
      {
          $lookup : {
              from : "categories",
              localField : "categoryId",
              foreignField : "_id",
              as : "categoryId"
          }
      },
      {
          $match : {
              "categoryId.categoryName" : "MOBILES"
          }
      },{
        $unwind : "$variants"  
      },{
          $match : {
              "variants.stockQuantity" : 0
          }
      },
      {
          $group : {_id : null, totalAmount : {$sum : "$variants.price"}}
      }
  ])
  console.log(result)
    res.render("admin-view/admin.products.ejs",{message,products,page,pages,count,productsFullList})
  }

  const getAddProduct = async (req,res) => {
    const {categories,brands,products} = await productService.getAddProduct()
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.add-product.ejs",{message,categories,brands,products})
  }

  const addProduct = async (req,res) => {
    try {
      const { productName, description,brandId,categoryId,isFeatured} = req.body;
      const productExist = await productService.doesProductExist(productName)
      if(productExist){
        req.session.message = "Product already Exists"
          return res.redirect("/admin/products")
      }
      if(!req.files || req.files.length < 3){
        req.session.message = "Minimum 3 Images required"
        return res.redirect("/admin/add-product")
      }
     let booleanValue = null;
      if(isFeatured === "true"){
        booleanValue = true
      }else{
        booleanValue = false
      }
      
      await productService.createNewProduct(productName,description,brandId,categoryId,booleanValue,req.body.variants,req.files)
      req.session.message = "Product Created Successfully";
     return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      req.session.message = ERROR_MESSAGES.SERVER_ERROR
      return res.redirect("/admin/products");
    }
  }
  const getEditProduct = async (req,res) => {
    const product = await productService.getProduct(req.query.id)
    const {categories,brands,products} = await productService.getAddProduct()
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.edit-product.ejs",{message,product,categories,brands,products})
  }

  const editProduct = async (req, res) => {
    try {
      const { productName, description, brandId, categoryId,imageInsertType,isFeatured} = req.body;
      const variants = req.body.variants;
      
      const product = await productService.getProduct(req.query.id);
      if (!product) {
        req.session.message = "Product not found!";
        return res.redirect("/admin/products");
      }

      let imageVariant = req.query.variant?.split(",").map(value => Number(value))
      let imageToBeDeleted = req.query.image?.split(",").map(value => Number(value))
      
        
      
      const variantEntries = Object.keys(variants).map(async (index) => {
        
        const variant = variants[index];
        const filesOfVariant = req.files.filter(
         
          (file) => file.fieldname === `variants[${index}][productImages]`
        );
  
        let imageUrls = [];
  
        if (filesOfVariant.length > 0) {
        
          const uploadImages = filesOfVariant.map(async (file) => {
            const result = await productService.uploadToCloudinary(file)
            return result.secure_url;
          });
  
          imageUrls = await Promise.all(uploadImages);
          let insertImage = null;
          if(Array.isArray(imageInsertType)){
            insertImage = imageInsertType[index]
          }else{
            insertImage = imageInsertType
          }
          if(insertImage === "Deleted First"){
            let setImageCounter = 0;
                  for(let i = 0 ; i < imageVariant.length ; i++){
                    
                    if(imageVariant[i] === Number(index)){
                     if(setImageCounter <= imageUrls.length - 1){
                      let publicId = extractPublicId(product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]])
                      await productService.deleteFromCloudinary(publicId)
                      product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]] = imageUrls[setImageCounter]
                        imageUrls[setImageCounter] = null
                        setImageCounter++
                     }else{
                      let publicId = extractPublicId(product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]])
                      await productService.deleteFromCloudinary(publicId)
                      product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]] = null
                     }
                    }
                  }
                  for(let i = 0 ; i < imageUrls.length ; i++){
                    if(imageUrls[i] !== null){
                      product.variants[index].productImages.push(imageUrls[i])
                      imageUrls[i] = null
                    }
                  }
                  product.variants[index].productImages = product.variants[index].productImages.filter(link => link !== null)
                  
                  imageUrls = product.variants[index].productImages
          }else if(insertImage === "Add Normally"){
            for(let i = 0 ; i < imageVariant.length ; i++){
              if(imageVariant[i] === Number(index)){
                let publicId = extractPublicId(product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]])
                await productService.deleteFromCloudinary(publicId)
                product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]] = null
              }
            }
            for(let i = 0 ; i < imageUrls.length ; i++){
              product.variants[imageVariant[i]].productImages.push(imageUrls[i])
            }
            product.variants[index].productImages = product.variants[index].productImages.filter(link => link !== null)
            imageUrls = product.variants[index].productImages
          }else if(insertImage === "Not Applicable"){
            
            if(imageVariant === undefined){
              if(product?.variants[index]?.productImages !== undefined){
                for(let i = 0 ; i < imageUrls.length ; i++){
                  product.variants[index].productImages.push(imageUrls[i])
                }
                imageUrls = product.variants[index].productImages
              }else{
                imageUrls = imageUrls
              }
            }
              
          }
          
          
        } else {
          
          const oldVariant = product.variants[index];
          if(imageVariant !== undefined){
            for(let i = 0 ; i < imageVariant.length ; i++){
              if(imageVariant[i] === Number(index)){
                let publicId = extractPublicId(product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]])
                      await productService.uploadToCloudinary(publicId)
                product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]] = null
              }
            }
            product.variants[index].productImages = product.variants[index].productImages.filter(link => link !== null)
            imageUrls = product.variants[index].productImages
          }else{
            imageUrls = oldVariant ? oldVariant.productImages : [];
          }
         
        }
  
        return {
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          stockStatus: variant.stockStatus,
          productImages: imageUrls,
          productOfferId : product.variants[index].productOfferId
        };
      });
  
      const finalVariants = await Promise.all(variantEntries);
      
      await Product.findByIdAndUpdate({_id : req.query.id},{$set : {
      productName,
      description,
      brandId,
      categoryId,
      variants : finalVariants,
      isFeatured
      }})
  
  
      req.session.message = "Product Updated Successfully";
      return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      req.session.message = ERROR_MESSAGES.SERVER_ERROR
      return res.redirect("/admin/products");
    }
  };




  const restoreProduct = async (req,res) => {
    try {
      await productService.restoreProduct(req.query.id,req.query.variant)
    req.session.message = "Product Restored Successfully"
    return res.status(HTTP_STATUS.OK).json({
      success : true
     })
    } catch (error) {
        console.log(error)
        req.session.message = ERROR_MESSAGES.SERVER_ERROR
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success : false,
          message : ERROR_MESSAGES.SERVER_ERROR
         })
    }
}   
    const blockProduct = async (req,res) => {
    try {
      await productService.deleteProduct(req.query.id,req.query.variant)
     req.session.message = "Product has been succesfully Blocked"
     return res.status(HTTP_STATUS.OK).json({
      success : true
     })
     } catch (error) {
      console.log(error)
      req.session.message = ERROR_MESSAGES.SERVER_ERROR
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success : false,
        message : ERROR_MESSAGES.SERVER_ERROR
       })
    }
}


module.exports = {
    getProducts,
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    restoreProduct,
    blockProduct
}