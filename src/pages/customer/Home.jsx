import React from 'react'
import Navbar from '../../components/common/Navbar'
import HeroSection from './HeroSection'
import Footer from '../../components/common/Footer'
import DishCarousel from './DishesGallery'
import Citywise from './Citywise'


const Home = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <DishCarousel />
      <Citywise />
    </div>
  )
}

export default Home
