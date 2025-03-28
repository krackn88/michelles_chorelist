import React, { useState } from 'react';
import { Card, Button, Form, Alert, ProgressBar, Modal } from 'react-bootstrap';
import coziIntegrationService from '../services/coziIntegrationService';

/**
 * Setup Wizard for configuring Cozi integration
 * Guides user through the setup process with step-by-step instructions
 */
const SetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    coziUrl: '',
    coziToken: ''
  });

  const totalSteps = 3;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setStep(prevStep => prevStep + 1);
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    setStep(prevStep => prevStep - 1);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Test and save Cozi integration
      const result = await coziIntegrationService.setupIntegration({
        url: formData.coziUrl,
        token: formData.coziToken
      });

      if (result.success) {
        setSuccess('Cozi integration setup successfully!');
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        setError(result.message || 'Failed to set up Cozi integration');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h4>Welcome to the Family Chore Manager Setup!</h4>
            <p>This wizard will help you connect to your Cozi calendar to import family schedules and events.</p>
            <p>You'll need:</p>
            <ul>
              <li>Your Cozi account login information</li>
              <li>A Cozi API token (we'll show you how to get this)</li>
            </ul>
            <p>Let's get started!</p>
          </>
        );
      case 2:
        return (
          <>
            <h4>Getting Your Cozi API Token</h4>
            <ol>
              <li>Log in to your Cozi account at <a href="https://www.cozi.com/" target="_blank" rel="noopener noreferrer">www.cozi.com</a></li>
              <li>Navigate to Account Settings &gt; API Access</li>
              <li>If you don't see an API token, click "Generate API Token"</li>
              <li>Copy the token to use in the next step</li>
            </ol>
            <Alert variant="info">
              Your API token is like a password. Never share it with anyone else!
            </Alert>
          </>
        );
      case 3:
        return (
          <>
            <h4>Connect to Cozi</h4>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Cozi URL</Form.Label>
                <Form.Control
                  type="text"
                  name="coziUrl"
                  value={formData.coziUrl}
                  onChange={handleInputChange}
                  placeholder="https://www.cozi.com/api"
                  required
                />
                <Form.Text className="text-muted">
                  Usually https://www.cozi.com/api unless you have a custom domain
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cozi API Token</Form.Label>
                <Form.Control
                  type="password"
                  name="coziToken"
                  value={formData.coziToken}
                  onChange={handleInputChange}
                  placeholder="Enter your Cozi API token"
                  required
                />
              </Form.Group>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Connecting...' : 'Complete Setup'}
                </Button>
              </div>
            </Form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={true} backdrop="static" keyboard={false} centered size="lg">
      <Modal.Header>
        <Modal.Title>Family Chore Manager Setup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="setup-wizard-card">
          <Card.Body>
            <ProgressBar now={(step / totalSteps) * 100} className="mb-4" />
            {renderStepContent()}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        {step < totalSteps ? (
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        ) : null}
        {step === 1 && (
          <Button variant="outline-secondary" onClick={onComplete}>
            Skip for now
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SetupWizard;