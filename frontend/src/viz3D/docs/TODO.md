# ECS
- Build simple ECS system - Done
    - Component manipulation for Entities
    - Entity manipulation for systems
    - fixed update
- Enable consistent fixedupdate for all systems
    - Systems should be able to rate limit to 30fps
    - Remove Pre and Post update

## Genome Tree
- Create interval tree to represent genome - Done
- Add basic repositioning routine - Done
- Add basic orientation routine from HI-C data
- Add routine to load and unload segments of the genome.

## Chromosome Rendering
- Create a directional track shader for chromosomes.

## Gene Rendering System
- Come up with a set of objects to represent the following of a gene
    - Transcription Region
    - Exons
    - Introns
    - CDS

## ChartSystem
- Build out simple line chart component
    - [Optional] use shaders to generate a grid and spline. Map domain to the uv coordinates
    - [Optional] use canvas to generate chart. Convert canvas to a textue for use with the plane
- Get charts to map to the uvs of a plane
- Orient plane to the transform based off the genome tree

## PickingSystem
- Allow components to get picked by clicking on their entities or flagging entities that are picked.

## CameraSystem
- Allow camera to fly through different parts of genome 

## UI
- Create a canvas and panel system for drawing arbitrary windows to the screen.
- Enable charts to move from the genome view to the UI.
