# Setup
## How to run the services
1. Clone the repository;
2. Open the terminal in the `src` folder of the desired service to run (e.g.: `.../services/constructor/src`);
3. Run `npm start [--SERVER_PORT=<port>]`
    - If the argument `SERVER_PORT` is omitted:
      - plumber services will run on port `3000`
      - electrician services will run on port `4000`
      - constructor services will run on port `5000`
      
      and no change is required to the given Postman collection.

   - If you desire to change or add ports (e.g. to spawn multiple instances of the same service), you need to specify the number port in the argument `SERVER_PORT` and change the variable `baseUrl` in the corresponding Postman collection accordingly.

## How to test the services using Postman
The Postman collection for each service is located in `/services/<serviceName>/api/<serviceName>.postman_collection.json`.

# API guide
A typical interaction between the House Renovation Company (HRC) and the third party service (TPS) is the following:  
1. The HRC sends a request for quotation to the TPS (`POST /rfq`);
2. The TPS answers with a quotation with status `READY` if the TPS is interested in the rfq, `CANCELLED` otherwise. In the latter case the interaction ends;
3. If the HRC does not select the TPS as a partner for the requested work, it informs the TPS (`DELETE /rfq/{rfqNumber}`), otherwise it sends to the TPS the information about the project (`POST /projects`);
4. The HRC sends a plan proposal for the schedule of the activities to be performed by the TPS (`POST /projects/{projectId}/planProposal`);
5. The TPS evaluates the plan proposal and informs the HRC about its decision;
6. If at least one of the needed TPS declines the plan proposal, HRC informs the TPS (`DELETE /projects/{projectId}/planProposal`) and the flow is repeated from point 4, otherwise HRC informs the TPS (`POST /projects/{projectId}/planProposal/confirmation`), which means that the plan proposal has been confirmed;
7. The HRC monitors the progress of the jobs (`GET /projects/{projectId}/jobs`);
8. The HRC updates the status of the project (`PUT /projects/{projectId}/status`).

The type of interaction between the HRC and the TPS described in point 2 depends from the specific TPS. In particular:
-  plumbers: asynchronous interaction (pull model);
-  electricians: asynchronous interaction (push model);
-  constructors: synchronous interaction.