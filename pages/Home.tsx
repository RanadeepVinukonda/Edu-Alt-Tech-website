import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import SolutionSection from '../components/sections/SolutionSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import CurriculumSection from '../components/sections/CurriculumSection';
import AppShowcaseSection from '../components/sections/AppShowcaseSection';
import ArchitectureSection from '../components/sections/ArchitectureSection';
import PricingSection from '../components/sections/PricingSection';
import CaseStudySection from '../components/sections/CaseStudySection';
import VisionSection from '../components/sections/VisionSection';
import CtaSection from '../components/sections/CtaSection';

const Home: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <CurriculumSection />
      <AppShowcaseSection />
      <ArchitectureSection />
      <PricingSection />
      <CaseStudySection />
      <VisionSection />
      <CtaSection />
    </div>
  );
};

export default Home;
