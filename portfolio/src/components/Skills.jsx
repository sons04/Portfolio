// src/components/Skills.jsx
import React from 'react';

const Skills = () => {
  return (
    <section id="skills" className="text-center mb-20 fade-in">
      <h2 className="text-4xl font-bold mb-10 text-indigo-400">Skills</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-gray-300 text-left max-w-4xl mx-auto">

        {/* Technical Skills */}
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Technical Skills</h3>
          <ul className="space-y-2 text-sm">
            <li>• .NET, AngularJS, Ionic, WordPress, HTML/CSS, JavaScript, PHP, Web3, MetaMask API</li>
            <li>• AWS (Lambda, DynamoDB, API Gateway, S3), Cloudflare</li>
            <li>• Cybersecurity (CrowdStrike, IBM QRadar, Splunk, OpenVAS, Burp Suite, ELK Stack)</li>
            <li>• Malware Analysis (YARA, VirusTotal API), Penetration Testing, Bash/Shell Scripting</li>
            <li>• 3D Design (Blender, Cura), Robotics (Arduino, OpenCV, YOLOv8)</li>
          </ul>
        </div>

        {/* Languages */}
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Languages</h3>
          <ul className="space-y-2 text-sm">
            <li>• English — Proficient</li>
            <li>• Spanish — Native</li>
            <li>• German — Beginner</li>
            <li>• Japanese — Beginner</li>
          </ul>
        </div>

      </div>
    </section>
  );
};

export default Skills;
