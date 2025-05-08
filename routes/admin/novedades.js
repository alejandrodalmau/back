var express = require('express');
var router = express.Router();
exports.router = router;
var novedadesModel=require('./../../models/novedadesModel');
var util=require('util');
var cloudinary=require('cloudinary').v2;
exports.cloudinary = cloudinary;
const uploader=util.promisify(cloudinary.uploader.upload);
const destroy=util.promisify(cloudinary.uploader.destroy);

/////novedades/////
router.get('/',async function (req,res,next) {
  var novedades=await novedadesModel.getNovedades();
  novedades=novedades.map(novedad =>{
    if(novedad.img_id){
      const imagen=cloudinary.image(novedad.img_id ,{
        with:100,
        height:100,
        crop:'fill'
      });
      return{
        ...novedad,
        imagen
      }
    } else{
      return {...novedad,
                 imagen:''
      }      
    }
  });
  
  res.render('admin/novedades',{
    layout:'admin/layout',
    usuario:req.session.nombre,
    novedades
  });
});
router.get('/agregar',(req,res,next)=>{
  res.render('admin/agregar',{
    layout:'admin/layout'
  });
});
router.post('/agregar',async(req,res,next)=>{
 
  try{
     var img_id='';
     if(req.files && Object.keys(req.files).length>0){
      imagen=req.files.imagen;
      img_id=(await uploader(imagen.tempFilePath)).public_id;
     }


    if(req.body.titulo !=""&& req.body.subtitulo !=""&& req.body.novedad !=""){
      await novedadesModel.insertNovedad({
        ...req.body,
        img_id
      });
      
      res.redirect('/admin/novedades')
    } else {
      res.render('admin/agregar', {
        layout:'admin/layout',
        error:true,message:'todos los campos son requeridos'        
      })
    }
  } catch (error){
    console.log(error)
    res.render('admin/agregar', {
      layout:'admin/layout',
      error:true ,message:'no se cargo la novedad'
    });
  }
});
router.get('/eliminar/:id',async(req,res,next)=>{
  var id=req.params.id;
  let novedad=await novedadesModel.getNovedadById(id);
  if(novedad.img_id){
    await(destroy(novedad.img_id));
  }
  await novedadesModel.deleteNovedadById(id);
  res.redirect('/admin/novedades')
});
router.get('/modificar/:id',async(req,res,next)=>{
  let id=req.params.id;
  let novedad=await novedadesModel.getNovedadById(id);
  res.render('admin/modificar',{
    layout:'admin/layout',
    novedad
  })
})
router.post('/modificar',async(req,res,next)=>{
  try{

    let img_id=req.body.img_original;
    let borrar_img_vieja=false;
    if(req.body.img_delete==="1"){
      img_id=null;
      borrar_img_vieja=true;

    }else{
      if(req.files && Object.keys(req.files).length>0){
        imagen=req.files.imagen;
        img_id=(await uploader(imagen.tempFilePath)).public_id;
        borrar_img_vieja=true;

      }
    }
    if(borrar_img_vieja && req.body.img_original){
      await (destroy(req.body.img_original));
    }
    let obj ={
      titulo:req.body.titulo,
      subtitulo:req.body.subtitulo,
      novedad:req.body.novedad,
      img_id
    }
    await novedadesModel.modificarNovedadById(obj,req.body.id);
    res.redirect('/admin/novedades');
  }
  catch(error){
    console.log(error)
    res.render('admin/modificar',{
      layout:'admin/layout',
      error:true,message:'no se modifico la novedad'
    })
  }
})





/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin/novedades',{
    layout:'admin/layout',
    persona:req.session.nombre
    
  });
});
module.exports=router;