
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: May 11, 2025</p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            <div>
              <p className="text-gray-700 leading-relaxed">
                At Anxiety Companion, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application or website.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect information that you provide directly to us when you:</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>• Register for an account</li>
                <li>• Complete your profile</li>
                <li>• Use the chat feature with our AI companion</li>
                <li>• Track your anxiety levels</li>
                <li>• Search for therapists</li>
                <li>• Contact our support team</li>
              </ul>
              <p className="text-gray-700 mt-4">
                This information may include your name, email address, password, location (if enabled), anxiety ratings, conversation history with the AI companion, and any other information you choose to provide.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>• Provide, maintain, and improve our services</li>
                <li>• Process and complete transactions</li>
                <li>• Send you technical notices and support messages</li>
                <li>• Respond to your comments and questions</li>
                <li>• Develop new products and services</li>
                <li>• Personalize your experience</li>
                <li>• Monitor and analyze usage patterns</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
              <p className="text-gray-700">
                Your data is stored securely using industry-standard encryption and security practices. We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sharing Your Information</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this Privacy Policy.
              </p>
              <p className="text-gray-700 mb-4">We may share your information with:</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>• Service providers who perform services on our behalf</li>
                <li>• Professional therapists, but only with your explicit consent</li>
                <li>• Law enforcement or other government agencies when required by law</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>• Access the personal information we have about you</li>
                <li>• Correct inaccuracies in your personal information</li>
                <li>• Delete your personal information</li>
                <li>• Object to the processing of your personal information</li>
                <li>• Request that we transfer your personal information to another service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@anxietycompanion.com" className="text-blue-600 hover:text-blue-800 underline">
                  privacy@anxietycompanion.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
