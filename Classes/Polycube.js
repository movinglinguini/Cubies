function PolyCube(position, name = ""){
	this.id = PolyCube.ID
	this.name = name
	this.scale = 1
	this.Obj = new THREE.Group()
	this.trans_helper = new THREE.AxisHelper(4)
	this.pick_context = null
	this.context_name = ''

	this.Obj.position.copy(LatticeToReal(position))
	this.Obj.add(this.trans_helper)
	this.picking_polycube = this.Obj.clone()

	var contexts = {'face': new THREE.Scene(), 'hinge' : new THREE.Scene(), 'cube' : new THREE.Scene(), 'new_cube' : new THREE.Scene()}

	var face_picking_polycube = this.Obj.clone()
	var hinge_picking_polycube = this.Obj.clone()
	var cube_picking_polycube = this.Obj.clone()
	var new_cube_picking_polycube = this.Obj.clone()

	contexts['face'].add(face_picking_polycube)
	contexts['hinge'].add(hinge_picking_polycube)
	contexts['cube'].add(cube_picking_polycube)
	contexts['new_cube'].add(new_cube_picking_polycube)

	var AdjacencyGraph = new FaceEdgeDualGraph()
	var _lattice_position = position
	var L_Cubes = []
	var L_CubeNames = []
	var L_Hinges = []

	var Color2Face_Map = []
	var FaceName2Color_Map = []
	var Hinge2Color_Map = []
	var Color2Hinge_Map = []
	var Cube_Color_Map = []

	var that = this

	this.Add_Cube = function(position){
		var key = PosToKey(position)

		if(!(key in L_Cubes))
		{
			cube = new Cube(position, this)

			L_Cubes[key] = cube
			latt_pos = cube.GetLatticePosition()

			//Rename all hinges and faces of the cube
			//The pattern for face names is c<cube_id><direction>. For example, cube 0's front face would be called c0front, and its top face would be called c0up
			//The pattern for hinge names is c<cube_id><direction>_h<local_position>. This has to do with the way faces are rotated around in the cube instantiation.
			//It's rather unintuitive, but the back face's "up" direction is the world's "down". The only face with an intuitive direction is the front. See the cube
			//instantiation function Cube.GenerateCube for a more detailed explanation
			for(faceNum = 0; faceNum < cube.Obj.children.length; faceNum++)
			{
				var face = cube.Obj.children[faceNum]
				var dir = face.name
				face.name = PolyCube.CubeFaceString(cube.ID, face.name)

				for(childNum = 0; childNum < face.children.length; childNum++)
				{
					var facePart = face.children[childNum]
					if(facePart.name != "body")
					{
						facePart.name = face.name + "_"+facePart.name
					}
				}
			}

			var hinge_picking_cube = cube.Obj.clone()
			for(faceNum = 0; faceNum < hinge_picking_cube.children.length; faceNum++)
			{
				var face = hinge_picking_cube.children[faceNum]

				for(childNum = 0; childNum < face.children.length; childNum++)
				{
					var facePart = face.children[childNum]
					if(facePart.name == "body")
					{
						facePart.material = new THREE.MeshBasicMaterial({'color' : 0})
					}
					else
					{
						var color = cube.ID + cube.ID*24 + childNum
						facePart.material = new THREE.MeshBasicMaterial({'color' : color})
					}
				}
			}

			cube.hinge_picking_cube = hinge_picking_cube

			//Cube faces have adjacency with each other, so let's set this first
			SetAdjacentFacesWithSelf(cube)

			/*///////////////////////////
			START CLEANING CUBE AND SETTING UP ADJACENCY
			*///////////////////////////
			//Clean up the cube so no two faces are incident
			for(var key in PolyCube.key_to_dir)
			{
				var dir = PosToKey(SumOfVectors([PolyCube.key_to_dir[key], latt_pos]))
				var cube_2 = L_Cubes[dir]
				if(ObjectExists(cube_2))
				{
					console.log("Adjacency with " + key)
					HandleFaceRemoval(cube, key)
					HandleFaceRemoval(cube_2, PolyCube.dir_to_opp[key])

					SetAdjacentFaces(cube, cube_2, key)
				}
			}
			/*////////////////////////
			FINISH CLEANING CUBE AND SETTING UP ADJACENCY
			*///////////////////////

			/*////////////////////
			START MAPPING EACH FACE TO A COLOR
			*////////////////////
			//The cube automatically has the faces of the picking cube colored
			face_picking_polycube.add(cube.face_picking_cube)
			for(var dir in cube.faceColors)
			{
				var face = cube.Obj.getObjectByName(PolyCube.CubeFaceString(cube.ID, dir))

				if(ObjectExists(face))
				{
					Color2Face_Map[cube.faceColors[dir]] = face
				}
			}
			//Adding to the cube picking scene would also be trivial because the cube automatically has its color stored as well
			cube_picking_polycube.add(cube.cube_picking_cube)
			//Adding to the new cube picking scene would just


			/*//////////////////////
			FINISH MAPPING EACH FACE TO A COLOR 
			*//////////////////////

			this.Obj.add(cube.Obj)
			this.picking_polycube.add(cube.polycube_picking_cube)

			return cube
		}
		else
		{
			console.log("Cube already exists here")
		}
	}

	//Set the x-axis of the origin of this polycube
	this.Set_PosX = function(x){
		_lattice_position.x = Math.floor(x)
		this.Obj.position.x = LatticeToRealXZ(x)
		face_picking_polycube.x = this.Obj.position.x
		hinge_picking_polycube.x = this.Obj.position.x
		cube_picking_polycube.x = this.Obj.position.x
		new_cube_picking_polycube.x = this.Obj.position.x
	}

	//Set the y-axis of the origin of this polycube
	this.Set_PosY = function(y){
		_lattice_position.y = Math.floor(y)
		that.Obj.position.y = LatticeToRealY(y)
		face_picking_polycube.y = this.Obj.position.y
		hinge_picking_polycube.y = this.Obj.position.y
		cube_picking_polycube.y = this.Obj.position.y
		new_cube_picking_polycube.y = this.Obj.position.y
	}

	//Set the z-axis of the origin of this polycube
	this.Set_PosZ = function(z){
		_lattice_position.z = Math.floor(z)
		that.Obj.position.z = LatticeToRealXZ(z)
		face_picking_polycube.z = this.Obj.position.z
		hinge_picking_polycube.z = this.Obj.position.z
		cube_picking_polycube.z = this.Obj.position.z
		new_cube_picking_polycube.z = this.Obj.position.z
	}

	//Return the list of cubes in the polycube
	this.Get_Cubes = function(){
		return L_Cubes
	}

	this.Get_Hinges = function(){
		return L_Hinges
	}

	this.SwitchToContext = function(context_name){
		if(ObjectExists(contexts[context_name]))
		{
			this.pick_context = contexts[context_name]
			this.context_name = context_name
		}
	}

	this.HandlePick = function(id){
		if(this.context_name == 'face')
		{
			var face = Color2Face_Map[id]

			console.log(face.name)
		}
		else
		{
			return false
		}

		return true
	}

	//Let cube1 be the cube we are adding to the polycube, and cube2 be a cube adjacent to cube1. Then dir is the Vector3 representing the direction from
	//cube1 to cube2. For each face that is not facing the same or opposite direction to dir, check if each cube has the corresponding face.
	//If so, then the respective faces of each cube are adjacent.
	//If not, then there are two possibilities:
	// 1. there is a cube adjacent to cube2
	// 2. the missing face was cut out from either cube
	//Then, we simply check for 1. If case 1 fails, then it follows that case 2 is correct, and there is no adjacency.
	var SetAdjacentFaces = function(cube_1, cube_2, dir)
	{
		for(i = 0; i < PolyCube.dir_keys.length; i++)
		{
			var dir2 = PolyCube.dir_keys[i]
			if(dir2 != dir && dir2 != PolyCube.dir_to_opp[dir])
			{
				var face_1 = cube_1.Obj.getObjectByName(PolyCube.CubeFaceString(cube_1.ID, dir2))
				var face_2 = cube_2.Obj.getObjectByName(PolyCube.CubeFaceString(cube_2.ID, dir2))

				if(ObjectExists(face_1) && ObjectExists(face_2))
				{
					AdjacencyGraph.AddNeighboringFaces(face_1.name, face_1,
					face_2.name, face_2)

					HandleEdgeComparisons(cube_1, cube_2, face_1, face_2)
				}
				else
				{
					CheckAndSetAdjacentWithDiagonal(cube_1, dir, dir2)
				}
			}
		}
	}

	//Let cube1 be the cube we are adding to the polycube, and cube2 be a cube adjacent to cube1. Then, dir1 is the Vector3 representing the direction from cube1 to cube2,
	//and dir2 is the direction from cube2 where there may be another cube, which will be called cube3. If cube3 exists, then it is diagonal to cube1, and so one of its faces
	//will be adjacent to one of cube1's faces.
	//In particular, the adjacent faces between cube1 and cube3 would be cube1's dir2 face and cube3 opposite(dir1) face.
	//In this code, cube3 will be called cube_2, and cube1 would just be called cube.
	var CheckAndSetAdjacentWithDiagonal = function(cube, dir1, dir2)
	{
		var cube_2 = L_Cubes[PosToKey(SumOfVectors([PolyCube.key_to_dir[dir1], PolyCube.key_to_dir[dir2], cube.GetLatticePosition()]))]

		if(ObjectExists(cube_2))
		{
			var face_1 = cube.Obj.getObjectByName(PolyCube.CubeFaceString(cube.ID, dir2))
			var face_2 = cube_2.Obj.getObjectByName(PolyCube.CubeFaceString(cube_2.ID, PolyCube.dir_to_opp[dir1]))

			if(ObjectExists(face_1) && ObjectExists(face_2))
			{
				AdjacencyGraph.AddNeighboringFaces(face_1.name, face_1, face_2.name, face_2)
			}

			HandleEdgeComparisons(cube, cube_2, face_1, face_2)
		}	
	}

	//For each face in a cube, we can say that it is adjacent to any other face in the same cube if and only if they are not facing opposite directions
	var SetAdjacentFacesWithSelf = function(cube)
	{
		for(i = 0; i < PolyCube.dir_keys.length; i++)
			{
				d1 = PolyCube.dir_keys[i]
				for(k = 0; k < PolyCube.dir_keys.length; k++)
				{
					d2 = PolyCube.dir_keys[k]
					if(d1 != d2 && PolyCube.dir_to_opp[d1] != d2)
					{
						var face_1 = cube.Obj.getObjectByName(PolyCube.CubeFaceString(cube.ID, d1))
						var face_2 = cube.Obj.getObjectByName(PolyCube.CubeFaceString(cube.ID, d2))
						AdjacencyGraph.AddNeighboringFaces(face_1.name, face_1, 
							face_2.name, face_2)
					}
				}
			}
	}

	//This is a utility function for removing a face from both a cube and the face dual graph
	var HandleFaceRemoval = function(cube, dir){

		var facename = PolyCube.CubeFaceString(cube.ID, dir)
		
		for(var key in PolyCube.dir_keys)
		{
			var secondaryDir = PolyCube.dir_keys[key]
			if(secondaryDir != 'front' && secondaryDir != 'back')
			{
				var edge_pos = cube.edges[dir + '_' + secondaryDir].position

				var edge_pair = L_Hinges[PosToKey(edge_pos)]

				if(ObjectExists(edge_pair))
				{
					if(edge_pair[0].name.slice(0, 2) == "c" + cube.Obj.name)
					{
						delete L_Hinges[PosToKey(edge_pos)][0]
					}
					else
					{
						delete L_Hinges[PosToKey(edge_pos)][1]
					}	
				}
			}
		}

		AdjacencyGraph.RemoveFace(facename)
		cube.RemoveFace(facename)

		var color = FaceName2Color_Map[facename]

		if(ObjectExists(color))
		{
			delete FaceName2Color_Map[facename]
			delete Color2Face_Map[color]
		}
	}

	var HandleEdgeComparisons = function(cube_1, cube_2, face_1, face_2)
	{
		var face_dir_word_1 = face_1.name.slice(2, face_1.name.length)
		var face_dir_word_2 = face_2.name.slice(2, face_2.name.length)

		for(var keys_1 in PolyCube.dir_keys)
		{
			var second_dir_1 = PolyCube.dir_keys[keys_1]

			if(second_dir_1 != 'front' && second_dir_1 != 'back')
			{
				for(var keys_2 in PolyCube.dir_keys)
				{
					var second_dir_2 = PolyCube.dir_keys[keys_2]

					if(second_dir_2 != 'front' && second_dir_2 != 'back')
					{
						var dir_word_1 = face_dir_word_1 + '_' + second_dir_1
						var dir_word_2 = face_dir_word_2 + '_' + second_dir_2

						var edge_1 = cube_1.edges[dir_word_1]
						var edge_2 = cube_2.edges[dir_word_2]

						var edge_1_pos = edge_1.position
						var edge_2_pos = edge_2.position

						if(edge_1_pos.distanceTo(edge_2_pos) == 0)
						{
							L_Hinges[PosToKey(edge_1_pos)] = [cube_1.Obj.getObjectByName(face_1.name + '_' + second_dir_1), cube_2.Obj.getObjectByName(face_2.name + '_' + second_dir_2)]
						}
					}
				}
			}
		}
	}

	//Utility function for converting the lattice position of a cube to a key to look up in L_Cubes
	var PosToKey = function(position){
		return position.x.toFixed(1)+","+position.y.toFixed(1)+","+position.z.toFixed(1)
	}

	this.SwitchToContext('face')
}

PolyCube.ID = 0
PolyCube.name_being_changed = ""
PolyCube.Active_Polycube = null
PolyCube.L_Polycubes = []
PolyCube.ID2Poly = []

//The keys that we use to both denote directions from cube to cube and the labeling of each face in the cube
PolyCube.dir_keys = ["up", "down", "right", "left", "front", "back"]
//Mapping keys to their opposite labels
PolyCube.dir_to_opp = {"up": "down", "down": "up", "right": "left", "left": "right", "front": "back", "back": "front"}
//Mapping keys to the vectors that they represent, and vice-versa
PolyCube.key_to_dir = {
	"up" : new THREE.Vector3(0, 1, 0),
	"down": new THREE.Vector3(0, -1, 0),
	"left": new THREE.Vector3(-1, 0, 0),
	"right": new THREE.Vector3(1, 0, 0),
	"front": new THREE.Vector3(0, 0, 1),
	"back": new THREE.Vector3(0, 0, -1),
}
PolyCube.dir_to_key = {
	"0,1,0" : "up",
	"0,-1,0" : "down",
	"1,0,0" : "left",
	"-1,0,0" : "right",
	"0,0,1" : "front",
	"0,0,-1" : "back"
}

//A static utility function for taking a cube id and the label of a face on that cube and turning it into an id for usage in the dual graph
PolyCube.CubeFaceString = function(cubeID, dir)
{
	return "c" + cubeID + dir
}

//A static utility function for generating a new polycube object.
//It does the following:
//1. adds the polycube to the static list of polycubes,
//2. adds a corresponding DOM element to the list of polycubes that could be seen in the page
//3. adds corresponding functions to each of the added DOM elements. These functions including changing polycube names and positions, as well as setting
//	which polycube is active.
PolyCube.GenerateNewPolyCube = function(position, name)
{
	var new_pcube = new PolyCube(position, name)
	PolyCube.L_Polycubes[name] = new_pcube
	PolyCube.ID2Poly[new_pcube.id] = new_pcube


	PolyCube.ID++
	PolyCube.SwitchToNewActive(new_pcube)

	return new_pcube
}

PolyCube.ChangeName = function(old_name, new_name)
{
	var p_cube = PolyCube.Active_Polycube

	p_cube.name = new_name

	delete PolyCube.Active_Polycube

	PolyCube.L_Polycubes[new_name] = p_cube
	PolyCube.Active_Polycube = p_cube
}

PolyCube.SwitchToNewActive = function(new_active)
{
	if(PolyCube.Active_Polycube != null)
	{
		PolyCube.Active_Polycube.trans_helper.visible = false
	}

	PolyCube.Active_Polycube = new_active

	if(PolyCube.Active_Polycube != null)
	{
		PolyCube.Active_Polycube.trans_helper.visible = true
	}
}