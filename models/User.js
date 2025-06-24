const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: String,
  mobile: String,
  gender: String,
  dob: String,
  languages: String,
  location: String,
  idType: String,
  idNumber: String,
  bio: String,fullName:String,
  profession: String,
  userType: { type: String, enum: ['Property Agent', 'Individual'], default: 'Individual' }, 
  customProfession: String,
  habits: {
    smoking: String,
    alcohol: String,
    foodChoice: String,
    partying: String,
    guests: String,
    pets: String
  },
  interests: String,
  traits: String,
  companyName: String,
  yearOfEstablishment: Number,
  citiesOfOperation: [String],
  areasOfOperation: String,
  officeAddress: String,
  companyUrl: String,
  numberOfEmployees: Number,
  pointOfContact: String,
  licenseNumber: String,
  // Email Verification Fields
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiresAt: Date
});

const User = mongoose.model('User', userSchema);
module.exports = User;
