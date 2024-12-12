// import validator from "validator"
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'

///api for adding doctor

import validator from "validator"
import userModel from '../models/userModel.js'

const addDoctor = async(req,res) =>{
    try{

 const { name, email, password, speciality,degree, experience,about,fees,address} = req.body
 const imageFile = req.file

///cheching for all data to add doctor

if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address)

    {
        return res.json({success:false,message:"Missing Detalis"})
    }
  
    ///validate email format
    if (!validator.isEmail(email)){
        return res.json({success:false,message:"please enter a valid email"})
}

////validating strong password

if(password.length < 8){
            return res.json({success:false,message:"please enter a strong password"})

}

/// hasing doc password

const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password, salt)

///upload img to cloud
const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
const imageUrl = imageUpload.secure_url


const doctorData ={
    name,
    email,
    image:imageUrl,
    password:hashedPassword,
    speciality,
    degree,
    experience,
    about,
    fees,
    address:JSON.parse(address),
    date:Date.now()
}

const newDoctor = new doctorModel(doctorData)
await newDoctor.save()

res.json({success:true,message:"Doctor added"})




}catch (error) {

    console.log(error);
    res.json({success:false,message:error.message})
    
    }
}
//API for admin login
const loginAdmin= async (req,res) =>{
    try{

        const {email,password} = req.body
       if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){

       const token = jwt.sign(email+password,process.env.JWT_SECRET)
       res.json({success:true,token})

        }else{
            res.json({success:false,message:"invalid credentials"})
        }

    }catch (error){
        console.log(error);
    res.json({success:false,message:error.message})
    }
}

///api to get all doctors list for admin panel

const allDoctors =async (req,res) =>{
    try{

        const doctors =await doctorModel.find({}).select('-password')
        res.json({success:true,doctors})

    }catch (error) {
    
        console.log(error);
    res.json({success:false,message:error.message})
    }

}

/////Api to get all appointment list

const appointmentsAdmin = async(req,res) =>{

    try{
   
        const appointments = await appointmentModel.find({})
        res.json({success:true,appointments})

    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

///api for appint cancell

const appointmentCancel = async (req,res) =>{
    try{

        const {appointmentId} =req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

         await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})


        ///releasing doctor slot

        const {docId,slotDate,slotTime} =appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_bookes = doctorData.slots_bookes

        slots_bookes[slotDate] = slots_bookes[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slots_bookes})

        res.json({success:true,message:'Appointment Cancel'})

    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
    
    }
}

////api to get dashboard for admin

const adminDashboard = async (rq,res) =>{
    try {

      const doctors = await doctorModel.find({})
      const users = await userModel.find({})
      const appointments = await appointmentModel.find({})

      const dashData ={
        doctors: doctors.length,
        appointments:appointments.length,
        patients: users.length,
        latestAppointments: appointments.reverse().slice(0,5)

      }

      res.json({success:true,dashData})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}


export {addDoctor,loginAdmin,allDoctors,appointmentsAdmin,appointmentCancel,adminDashboard}