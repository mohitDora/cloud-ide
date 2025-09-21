import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { httpServerUrl, userId } from "@/utils/constants";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  template: "python" | "node";
  createdAt: string;
}

interface ProjectsProps {
  projects: Project[];
}

const Projects = ({ projects }: ProjectsProps) => (
  <div className="flex flex-wrap gap-4">
    {projects.map((project) => (
      <Link key={project.id} to={`/${project.id}`}>
      <div
        key={project.id}
        className="inline-block p-4 min-w-64 flex-col gap-4 outline rounded"
      >
        <h2 className="font-semibold">{project.name}</h2>
        <p>{project.template}</p>
        <p className="text-sm text-gray-500">{`Created At: ${new Date(project.createdAt).toDateString()}`}</p>
      </div>
      </Link>
    ))}
  </div>
);

interface DialogBoxProps {
  onCreate: (project: Project) => void;
}

const DialogBox = ({ onCreate }: DialogBoxProps) => {
  const [projectName, setProjectName] = useState("");
  const [projectTemplate, setProjectTemplate] = useState<"python" | "node" | null>(null);
  const [open, setOpen] = useState(false); // control dialog state

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!projectName.trim() || !projectTemplate) {
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName.trim(),
      template: projectTemplate,
      createdAt: new Date().toLocaleDateString(),
    };

    await onCreate(newProject);

    setProjectName("");
    setProjectTemplate(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create App</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Choose the template and start a new project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="template">Template</Label>
              <Select
                value={projectTemplate ?? ""}
                onValueChange={(val) => setProjectTemplate(val as "python" | "node")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="node">Node JS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const getProjects = async (userId: string) => {
    const res = await axios.get(`${httpServerUrl}/projects?userId=${userId}`)
    setProjects(res.data.projects)
  }

  const addProject = async (newProject: Project) => {
    await axios.post(`${httpServerUrl}/create-project?userId=${userId}&name=${newProject.name}&template=${newProject.template}`)
    getProjects(userId)
  };

  useEffect(() => {
    getProjects(userId)
  }, []);

  console.log(projects);

  return (
    <main className="space-y-6">
      <DialogBox onCreate={addProject} />
      <h1 className="text-xl font-bold">Projects</h1>
      {projects.length > 0 ? (
        <Projects projects={projects} />
      ) : (
        <p>No projects yet</p>
      )}
    </main>
  );
};

export default Dashboard;
