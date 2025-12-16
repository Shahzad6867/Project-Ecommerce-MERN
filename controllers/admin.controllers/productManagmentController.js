
const cloudinary = require("../../config/cloudinaryConfig.js")
const fs = require("fs");
const Product = require("../../models/product.model.js");
const Brand = require("../../models/brand.model.js");
const Category = require("../../models/category.model.js");
const {extractPublicId} = require("cloudinary-build-url")



const getProducts = async (req,res) => {
    const perPage = req.session.itemsPerPage || 5 
    const page = req.query.page || 1
    const productsFullList = await Product.aggregate().project({productName : 1,_id : 0})
     const products = await Product.find({}).populate("categoryId").populate("brandId").sort({createdAt : -1}).skip(perPage * page - perPage).limit(perPage)
     const count = await Product.countDocuments({})
    const pages = Math.ceil(count / perPage)
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.products.ejs",{message,products,page,pages,count,productsFullList})
  }

  const getAddProduct = async (req,res) => {
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const products = await Product.find({})
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.add-product.ejs",{message,categories,brands,products})
  }

  const addProduct = async (req,res) => {
    try {
      const { productName, description,brandId,categoryId,isFeatured} = req.body;
      const productExist = await Product.findOne({ productName : productName });
      if(productExist){
        req.session.message = "Product already Exists"
          return res.redirect("/admin/products")
      }
      if(!req.files || req.files.length < 3){
        console.log(!req.files || req.files.length < 3)
        req.session.message = "Minimum 3 Images required"
        return res.redirect("/admin/add-product")
      }
     let booleanValue;
      if(isFeatured === "true"){
        booleanValue = true
      }else{
        booleanValue = false
      }
      
      const variants = req.body.variants
      const variantEntries = Object.keys(variants).map(async (index) => {
        const variant = variants[index]

        const filesOfVariant = req.files.filter((file) => file.fieldname === `variants[${index}][productImages]`)
    
        const uploadImages = filesOfVariant.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path,{
            folder : "product-images"
          })
          fs.unlinkSync(file.path)
          return result.secure_url
        })

        const imageUrls = await Promise.all(uploadImages)

        return {
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          stockStatus: variant.stockStatus,
          productImages: imageUrls,
          }
      })

      const finalVariants = await Promise.all(variantEntries)

      const newProduct = new Product({
        productName,
        description,
        brandId,
        categoryId,
        isFeatured : booleanValue,
        variants: finalVariants,
      })

      await newProduct.save()
      req.session.message = "Product Created Successfully";
     return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
    }
  }
  const getEditProduct = async (req,res) => {
    const  {id} = req.query
    const product = await Product.find({_id : id}).populate("categoryId").populate("brandId")
    const categories = await Category.find({})
    const brands = await Brand.find({})
    const products = await Product.find({})
    const message = req.session.message || null
    delete req.session.message
    res.render("admin-view/admin.edit-product.ejs",{message,product,categories,brands,products})
  }

  const editProduct = async (req, res) => {
    try {
      const { id} = req.query;
      const { productName, description, brandId, categoryId,imageInsertType } = req.body;
      const variants = req.body.variants;
  
     


      const product = await Product.findById(id);
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
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "product-images",
            });
            fs.unlinkSync(file.path);
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
                      let result = await cloudinary.uploader.destroy(publicId,(error,result) => {
                        if(error) {
                          console.error(error)
                        }else{
                          console.log(result)
                        }
                      })
                      product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]] = imageUrls[setImageCounter]
                        imageUrls[setImageCounter] = null
                        setImageCounter++
                     }else{
                      let publicId = extractPublicId(product.variants[imageVariant[i]].productImages[imageToBeDeleted[i]])
                      let result = await cloudinary.uploader.destroy(publicId,(error,result) => {
                        if(error) {
                          console.error(error)
                        }else{
                          console.log(result)
                        }
                      })
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
                let result = await cloudinary.uploader.destroy(publicId,(error,result) => {
                  if(error) {
                    console.error(error)
                  }else{
                    console.log(result)
                  }
                })
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
                      let result = await cloudinary.uploader.destroy(publicId,(error,result) => {
                        if(error) {
                          console.error(error)
                        }else{
                          console.log(result)
                        }
                      })
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
        };
      });
  
      const finalVariants = await Promise.all(variantEntries);
      
      await Product.findByIdAndUpdate({_id : id},{$set : {
      productName,
      description,
      brandId,
      categoryId,
      variants : finalVariants
      }})
  
  
      req.session.message = "Product Updated Successfully";
      return res.redirect("/admin/products");
    } catch (error) {
      console.error(error);
      req.session.message = "Something went wrong!";
      return res.redirect("/admin/products");
    }
  };




  const restoreProduct = async (req,res) => {
    try {
        const {id} = req.query
     await Product.findByIdAndUpdate({_id : id},{$set : {isDeleted : false}})
    req.session.message = "Product Restored Successfully"
    res.redirect("/admin/products")
    } catch (error) {
        console.log(error)
    }
}   
    const deleteProduct = async (req,res) => {
    try {
        const {id} = req.query
     await Product.findByIdAndUpdate({_id : id},{$set : {isDeleted : true}})
    req.session.message = "Product Deleted"
    res.redirect("/admin/products")
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    getProducts,
    getAddProduct,
    addProduct,
    getEditProduct,
    editProduct,
    restoreProduct,
    deleteProduct
}