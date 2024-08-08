# Project Estimation - CURRENT
Date: 05/05/2024
Version: 1.0


# Estimation approach
Consider the EZElectronics  project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch
# Estimate by size
### 
|                                                                                                         | Estimate   |             
|---------------------------------------------------------------------------------------------------------|------------|  
| NC =  Estimated number of classes to be developed                                                       | 3          |             
| A = Estimated average size per class, in LOC                                                            | ~600       | 
| S = Estimated size of project, in LOC (= NC * A)                                                        | ~1800      |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 180        |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 5400       | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | ~1.2 weeks |               

We considered the 3 classes as '_high-level classes_' meaning that they don't necessarily
correspond to js classes, but they can include many utility classes, such as controllers, DAOs, ...

# Estimate by product decomposition
### 
| component name       | Estimated effort (person hours) |             
|----------------------|---------------------------------| 
| requirement document | 50                              |
| GUI prototype        | 15                              |
| design document      | 12                              |
| code                 | 160                             |
| unit tests           | 50                              |
| api tests            | 50                              |
| management documents | 10                              |


# Estimate by activity decomposition
### 
| Activity name                          | Estimated effort (person hours) |   
|----------------------------------------|---------------------------------|
| REQUIREMENT ENGINEERING                | 62                              |
| -- Stakeholders identification         | 1                               |
| -- Actors identification               | 1                               |
| -- Actors interfaces                   | 1                               |
| -- Context Diagram dev.                | 1                               |
| -- Analysis of different Persona Types | 2                               |
| -- Definition of goal FRs              | 10                              |
| -- Identification of needed NFRs       | 5                               |
| -- Use Cases & Scenarios Analysis      | 20                              |
| -- Use Case Diagram                    | 10                              |
| -- Glossary                            | 4                               |
| -- UML Class Diagram                   | 6                               |
| -- System Deployment                   | 1                               |
| DESIGN                                 | 27                              |
| -- visuals & concepts Definition       | 2                               |
| -- GUI components                      | 10                              |
| -- GUI development                     | 15                              |
| CODING                                 | 155                             |
| -- Code Organization                   | 30                              |
| -- Code Documentation                  | 10                              |
| -- Development                         | 100                             |
| -- Code Merging                        | 15                              |
| TESTING                                | 120                             |
| -- Unit Testing                        | 50                              |
| -- Integration                         | 20                              |
| -- Api Testing                         | 50                              |

### Gantt Diagram
![screenshot of Gantt Diagram by ProjectLibre](./img/gantt.png)


# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|                                    | Estimated effort | Estimated duration |          
|------------------------------------|------------------|--------------------|
| estimate by size                   | 180              | 1.2 weeks          |
| estimate by product decomposition  | 347              | 2.1 weeks          |
| estimate by activity decomposition | 364              | 2.3 weeks          |


The differences between the 3 techniques arise from the depth of the analysis performed:
10 LOC/ph seems to be an overestimated value for the first estimate because requirements
are a huge part of the project and were less considered in that method.
Other 2 techniques provide a more detailed approach so the time estimated turned out to be similar
for both of them. However, differences are present due to the high abstraction of the last method,
that highlighted each activity from the huge ones to the more specific ones.






