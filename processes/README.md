# Setup
## How to run the process on Camunda
1. Clone the repository;
2. Run Camunda;
3. Deploy on Camunda all files `.bpmn` in folder `/processes/executable/sources`. For file `executable.bpmn` include all forms in folder `/processes/executable/sources/forms`;
4. Run
    - one istance of acme service on port `9000`;
    - two istances of plumber service on ports `3000`, `3001`;
    - two istances of electrician service on ports `4000`, `4001`;
    - two istances of constructor service on ports `5000`, `5001`;
5. Start the process `Main process` on Camunda.

See `/services/README.md` for more details on how to run services.