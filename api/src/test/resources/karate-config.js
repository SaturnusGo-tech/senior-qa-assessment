function fn() {
  karate.configure('connectTimeout', 15000);
  karate.configure('readTimeout', 20000);
  karate.configure('printEnabled', false);
  karate.configure('report', { showLog: false, showAllSteps: false });
  return {
    baseUrl: java.lang.System.getenv('DEMOQA_API_URL') || 'https://demoqa.com',
    testPassword: java.lang.System.getenv('DEMOQA_TEST_PASSWORD') ||
      'Qa1!' + java.util.UUID.randomUUID().toString()
  };
}
