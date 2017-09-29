/*
Author: Luis Angel Garcia
Last Edited: 9/24/2017

Description: Data structure that maps faces and edges to their locations in R^3. Also keeps track of face rotations and normal locations.
The usage of this class should be for keeping track of face and edge locations as they are rotating in 3-D space.

*/

function FlexiFaceEdgeMap()
{
	var Loc2Face_Map = {} //A bijective mapping of a coordinate in R^3 to a face name.
	var Face2Data_Map = {} //A mapping of a face's name to its coordinate in R^3, as well as it's normal. This map should be kept invariant.
	var Face2FlexiData_Map = {} //Another mapping of a face's name to its coordinate in R^3, as well as it's normal. This is the one that could be changed.

	var Edge2Data_Map = {}
	var Edge2FlexiData_Map = {}

	var Face2Edges = {}

	var that = this

	this.AddFace = function(face_name, location, normal)
	{
		var s = location.x.toString() + "," + location.y.toString() + "," + location.z.toString()

		Loc2Face_Map[s] = face_name

		Face2Data_Map[face_name] = {}
		Face2Data_Map[face_name]["normal"] = normal.clone()
		Face2Data_Map[face_name]["location"] = location.clone()

		Face2FlexiData_Map[face_name] = {}
		Face2FlexiData_Map[face_name]["normal"] = normal.clone()
		Face2FlexiData_Map[face_name]["location"] = location.clone()

		Face2Edges[face_name] = []
	}

	this.RemoveFace = function(face_name)
	{
		var face_data = Face2Data_Map[face_name]

		if(!ObjectExists(face_data))
			return

		var s = face_data.location.x.toString() + "," + face_data.location.y.toString() + "," + face_data.location.z.toString()
		delete Loc2Face_Map[s]

		delete Face2Data_Map[face_name]

		delete Face2FlexiData_Map[face_name]

		var edges = Face2Edges[face_name]

		for(var e in edges)
		{
			RemoveEdge(edges[e])
		}

		delete Face2Edges[face_name]
	}

	this.AddEdge = function(edge_name, parent_face_name, location, axis)
	{

		if(!ObjectExists(Face2Data_Map[parent_face_name]))
		{
			throw "Cannot add new edge data if face doesn't exist"
		}

		var s = location.x.toString() + "," + location.y.toString() + "," + location.z.toString()

		Edge2Data_Map[edge_name] = {}
		Edge2Data_Map[edge_name]["axis"] = axis.clone()
		Edge2Data_Map[edge_name]["location"] = location.clone()

		Edge2FlexiData_Map[edge_name] = {}
		Edge2FlexiData_Map[edge_name]["axis"] = axis.clone()
		Edge2FlexiData_Map[edge_name]["location"] = location.clone()

		Face2Edges[parent_face_name].push(edge_name)
	}

	function RemoveEdge(edge_name)
	{
		delete Edge2Data_Map[edge_name]
		delete Edge2FlexiData_Map[edge_name]
	}

	//How the fuck am I supposed to write this one???
	this.RotateFaceAroundEdge = function(edge_name, face_name, rads, axis)
	{
		var obj = Face2FlexiData_Map[face_name]
		var pEObj = Edge2FlexiData_Map[edge_name]

		var separating_vec = new THREE.Vector3().subVectors(obj.location, pEObj.location)

		separating_vec.applyAxisAngle(axis, rads)

		obj.location.copy(separating_vec)
		obj.location.add(pEObj.location)

		obj.location.x = Math.round(obj.location.x)
		obj.location.y = Math.round(obj.location.y)
		obj.location.z = Math.round(obj.location.z)

		obj.normal.applyAxisAngle(axis, rads)

		obj.normal.x = Math.round(obj.normal.x)
		obj.normal.y = Math.round(obj.normal.y)
		obj.normal.z = Math.round(obj.normal.z)

		obj.normal.normalize()

		for(var e in Face2Edges[face_name])
		{
			var e_n = Face2Edges[face_name][e]

			obj = Edge2FlexiData_Map[e_n]

			separating_vec = new THREE.Vector3().subVectors(obj.location, pEObj.location)

			separating_vec.applyAxisAngle(axis, rads)

			obj.location.copy(separating_vec)
			obj.location.add(pEObj.location)

			obj.location.x = Math.round(obj.location.x)
			obj.location.y = Math.round(obj.location.y)
			obj.location.z = Math.round(obj.location.z)

			obj.axis.applyAxisAngle(axis, rads)

			obj.axis.x = Math.round(obj.axis.x)
			obj.axis.y = Math.round(obj.axis.y)
			obj.axis.z = Math.round(obj.axis.z)

			obj.axis.normalize()
		}
	}

	this.GetEndPoints = function(edge_name)
	{

		var data = this.GetEdgeData(edge_name)

		return [new THREE.Vector3().addVectors(data.location, data.axis), new THREE.Vector3().addVectors(data.location, new THREE.Vector3().copy(data.axis).multiplyScalar(-1))]

	}

	this.HaveCommonEdge = function(face_1_name, face_2_name)
	{
		var edges_1 = Face2Edges[face_1_name]
		var edges_2 = Face2Edges[face_2_name]

		for(var e in edges_1)
		{
			var edge = edges_1[e]

			
			var e_1_d = this.GetEdgeData(edge)

			for(var h in edges_2)
			{
				var hedge = edges_2[h]

				var e_2_d = this.GetEdgeData(hedge)

				if(e_1_d.location.equals(e_2_d.location))
					return true
			}
		}

		return false
	}

	this.GetEdgeData = function(edge_name)
	{
		return Edge2FlexiData_Map[edge_name]
	}

	this.GetFaceData = function(face_name)
	{
		return Face2FlexiData_Map[face_name]
	}

	this.ResetData = function()
	{
		for(var f in Face2Data_Map)
		{
			Face2FlexiData_Map[f].location.copy(Face2Data_Map[f].location)
			Face2FlexiData_Map[f].normal.copy(Face2Data_Map[f].normal)
		}

		for(var e in Edge2Data_Map)
		{
			Edge2FlexiData_Map[e].location.copy(Edge2Data_Map[e].location)
			Edge2FlexiData_Map[e].axis.copy(Edge2Data_Map[e].axis)
		}
	}
}